import { NextResponse } from "next/server";
import crypto from "crypto";
import { getOrder, upsertOrder } from "@/lib/order-store";
import { sendRefundToGoogleSheets } from "@/lib/google-sheets";

export const runtime = "nodejs";

interface MoMoRefundRequest {
  orderId: string; // ID của giao dịch hoàn tiền (khác với orderId gốc)
  transId: string; // Mã giao dịch MoMo từ giao dịch gốc
  amount: number; // Số tiền cần hoàn (1.000 - 50.000.000 VND)
  description?: string; // Mô tả chi tiết yêu cầu hoàn tiền
}

interface MoMoRefundResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  transId: number;
  resultCode: number;
  message: string;
  responseTime: number;
}

export async function POST(req: Request) {
  try {
    const body: MoMoRefundRequest = await req.json();

    const { orderId: refundOrderId, transId, amount, description = "" } = body;

    // Validation
    if (!refundOrderId || !transId || !amount) {
      return NextResponse.json(
        { error: "Thiếu thông tin: orderId, transId hoặc amount" },
        { status: 400 }
      );
    }

    // Validate amount range
    if (amount < 1000) {
      return NextResponse.json(
        { error: "Số tiền hoàn tối thiểu là 1.000 VND" },
        { status: 400 }
      );
    }

    if (amount > 50000000) {
      return NextResponse.json(
        { error: "Số tiền hoàn tối đa là 50.000.000 VND" },
        { status: 400 }
      );
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (!partnerCode || !accessKey || !secretKey) {
      console.error("Thiếu cấu hình MoMo: MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY");
      return NextResponse.json(
        { error: "Máy chủ chưa cấu hình thanh toán MoMo" },
        { status: 500 }
      );
    }

    // Lấy thông tin order gốc để kiểm tra
    const originalOrder = await getOrder(refundOrderId);
    if (!originalOrder) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    if (originalOrder.status !== "PAID") {
      return NextResponse.json(
        { error: "Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán thành công" },
        { status: 400 }
      );
    }

    // Kiểm tra số tiền hoàn không vượt quá số tiền đã thanh toán
    const originalAmount = originalOrder.amount || 0;
    if (amount > originalAmount) {
      return NextResponse.json(
        { error: `Số tiền hoàn (${amount.toLocaleString()} VND) không được vượt quá số tiền đã thanh toán (${originalAmount.toLocaleString()} VND)` },
        { status: 400 }
      );
    }

    // Generate requestId (unique cho mỗi request)
    const requestId = `REFUND_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create signature
    // Format: accessKey=$acessKey&amount=$amount&description=$description&orderId=$orderId&partnerCode=$partnerCode&requestId=$requestId&transId=$transId
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&description=${description}&orderId=${refundOrderId}&partnerCode=${partnerCode}&requestId=${requestId}&transId=${transId}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const payload = {
      partnerCode,
      orderId: refundOrderId,
      requestId,
      amount,
      transId: parseInt(transId, 10),
      lang: "vi",
      description: description || "Hoàn tiền đơn hàng",
      signature,
    };

    console.log("🔄 Processing refund request:", {
      refundOrderId,
      transId,
      amount,
      originalAmount,
    });

    // Determine MoMo API URL (sandbox or production)
    const momoApiUrl = process.env.MOMO_API_URL?.replace(
      "/v2/gateway/api/create",
      "/v2/gateway/api/refund"
    ) || "https://test-payment.momo.vn/v2/gateway/api/refund";

    const res = await fetch(momoApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data: MoMoRefundResponse = await res.json();

    if (!res.ok) {
      console.error("❌ MoMo Refund API error:", data);
      return NextResponse.json(
        {
          error: "Không thể xử lý hoàn tiền từ MoMo",
          details: data,
        },
        { status: res.status }
      );
    }

    // Xử lý kết quả
    if (data.resultCode === 0) {
      // Refund thành công
      console.log("✅ Refund thành công:", {
        refundOrderId,
        refundTransId: data.transId,
        amount: data.amount,
        message: data.message,
      });

      // Cập nhật trạng thái order
      // Nếu hoàn toàn bộ (amount === originalAmount) → status = REFUNDED
      // Nếu hoàn một phần → có thể giữ PAID hoặc thêm flag REFUNDED_PARTIAL
      if (amount === originalAmount) {
        await upsertOrder(refundOrderId, {
          status: "REFUNDED",
          transId: data.transId.toString(),
        });
      } else {
        // Hoàn một phần - có thể thêm thông tin refund vào order
        await upsertOrder(refundOrderId, {
          status: "PAID_PARTIAL_REFUND",
          transId: originalOrder.transId, // Giữ transId gốc
        });
      }

      // Gửi thông tin refund lên Google Sheets
      const updatedOrder = await getOrder(refundOrderId);
      await sendRefundToGoogleSheets(
        refundOrderId,
        data.transId.toString(), // Refund transaction ID
        transId, // Original transaction ID
        data.amount, // Refund amount
        originalAmount, // Original amount
        description || "Hoàn tiền đơn hàng",
        updatedOrder
      );

      return NextResponse.json({
        success: true,
        orderId: data.orderId,
        refundTransId: data.transId,
        amount: data.amount,
        message: data.message,
        resultCode: data.resultCode,
        responseTime: data.responseTime,
      });
    } else {
      // Refund thất bại
      console.error("❌ Refund thất bại:", {
        refundOrderId,
        resultCode: data.resultCode,
        message: data.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: data.message || "Hoàn tiền thất bại",
          resultCode: data.resultCode,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("POST /api/payment/refund thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi xử lý hoàn tiền" },
      { status: 500 }
    );
  }
}

