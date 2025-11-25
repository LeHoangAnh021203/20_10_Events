import { NextResponse } from "next/server";
import { readOrders, upsertOrder, getOrder } from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";
import crypto from "crypto";

export const runtime = "nodejs";

interface OrderStatus {
  status: string;
  transId?: string;
  updatedAt: string;
}

type MoMoMeta = Record<string, unknown>;

interface MoMoQueryResponse {
  partnerCode: string;
  requestId: string;
  orderId: string;
  extraData: string;
  amount: number;
  transId: number;
  payType: string;
  resultCode: number;
  refundTrans: MoMoMeta[];
  message: string;
  responseTime: number;
  paymentOption?: string;
  promotionInfo?: MoMoMeta[];
}

async function queryMoMoStatus(orderId: string): Promise<MoMoQueryResponse | null> {
  try {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;

    if (!partnerCode || !accessKey || !secretKey) {
      return null;
    }

    // Generate requestId
    const requestId = `QUERY_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create signature
    // Format: accessKey=$accessKey&orderId=$orderId&partnerCode=$partnerCode&requestId=$requestId
    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const body = {
      partnerCode,
      requestId,
      orderId,
      lang: "vi",
      signature,
    };

    // Determine MoMo API URL (sandbox or production)
    const momoApiUrl = process.env.MOMO_API_URL?.replace(
      "/v2/gateway/api/create",
      "/v2/gateway/api/query"
    ) || "https://test-payment.momo.vn/v2/gateway/api/query";

    const res = await fetch(momoApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("MoMo Query API error:", res.status);
      return null;
    }

    const data: MoMoQueryResponse = await res.json();
    return data;
  } catch (error) {
    console.error("Error querying MoMo status:", error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Thiếu orderId" },
        { status: 400 }
      );
    }

    // Ưu tiên: Gọi MoMo Query API để lấy trạng thái real-time
    const momoData = await queryMoMoStatus(orderId);

    if (momoData) {
      // Map MoMo resultCode to our status
      let status: "PENDING" | "PAID" | "FAILED" = "PENDING";
      if (momoData.resultCode === 0) {
        status = "PAID";
      } else if (momoData.resultCode && momoData.resultCode > 0) {
        status = "FAILED";
      }

      // Cập nhật vào local storage để đồng bộ
      if (status === "PAID" || status === "FAILED") {
        // Lấy order hiện tại để giữ lại thông tin đầy đủ
        const existingOrder = await getOrder(orderId);
        
        const updatedRecord = await upsertOrder(orderId, {
          status,
          transId: momoData.transId?.toString(),
          amount: momoData.amount,
          // Giữ lại serviceName và formData từ order cũ
          serviceName: existingOrder?.serviceName,
          formData: existingOrder?.formData,
          updatedAt: momoData.responseTime
            ? new Date(momoData.responseTime).toISOString()
            : new Date().toISOString(),
        });

        // Nếu thanh toán thành công, sync lên Google Sheets (chỉ nếu chưa sync)
        if (status === "PAID" && !updatedRecord.sheetsSyncedAt) {
          console.log("🔄 Syncing paid order to Google Sheets:", orderId);
          const syncResult = await sendOrderToGoogleSheets(
            orderId,
            updatedRecord,
            momoData.amount,
            momoData.transId?.toString(),
            momoData.message
          );
          
          // Nếu sync thành công, đánh dấu đã sync
          if (syncResult.success) {
            await upsertOrder(orderId, {
              sheetsSyncedAt: new Date().toISOString(),
            });
            console.log("✅ Order synced to Google Sheets successfully:", orderId);
          } else {
            console.error("❌ Failed to sync order to Google Sheets:", orderId, syncResult.error);
          }
        } else if (status === "PAID" && updatedRecord.sheetsSyncedAt) {
          console.log("⏭️ Order already synced to Google Sheets, skipping:", orderId);
        }
      }

      return NextResponse.json({
        orderId: momoData.orderId,
        status,
        transId: momoData.transId?.toString(),
        amount: momoData.amount,
        message: momoData.message || (
          status === "PAID"
            ? "Thanh toán thành công"
            : status === "FAILED"
            ? "Thanh toán thất bại"
            : "Đang xử lý"
        ),
        resultCode: momoData.resultCode,
        payType: momoData.payType,
        responseTime: momoData.responseTime,
        updatedAt: momoData.responseTime
          ? new Date(momoData.responseTime).toISOString()
          : new Date().toISOString(),
      });
    }

    // Fallback: Nếu không gọi được MoMo Query API, đọc từ local storage (file JSON)
    try {
      const orders = await readOrders();
      const order = orders[orderId] as OrderStatus | undefined;

      if (!order) {
        return NextResponse.json({
          orderId,
          status: "PENDING",
          message: "Đơn hàng chưa được xử lý hoặc không tồn tại",
        });
      }

      return NextResponse.json({
        orderId,
        status: order.status,
        transId: order.transId,
        updatedAt: order.updatedAt,
        message:
          order.status === "PAID"
            ? "Thanh toán thành công"
            : order.status === "FAILED"
            ? "Thanh toán thất bại"
            : "Đang xử lý",
      });
    } catch (error) {
      console.error("Error reading order status:", error);
      return NextResponse.json({
        orderId,
        status: "PENDING",
        message: "Không thể đọc trạng thái đơn hàng. Vui lòng thử lại sau.",
      });
    }
  } catch (error) {
    console.error("GET /api/payment/check-status thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi kiểm tra trạng thái" },
      { status: 500 }
    );
  }
}

