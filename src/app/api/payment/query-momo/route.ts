import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

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

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Thiếu orderId" },
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

    const data: MoMoQueryResponse = await res.json();

    if (!res.ok) {
      console.error("MoMo Query API error:", data);
      return NextResponse.json(
        { error: "Không thể truy vấn trạng thái từ MoMo", details: data },
        { status: res.status }
      );
    }

    // Map MoMo resultCode to our status
    let status: "PENDING" | "PAID" | "FAILED" = "PENDING";
    if (data.resultCode === 0) {
      status = "PAID";
    } else if (data.resultCode && data.resultCode > 0) {
      status = "FAILED";
    }

    return NextResponse.json({
      orderId: data.orderId,
      status,
      transId: data.transId?.toString(),
      amount: data.amount,
      message: data.message,
      resultCode: data.resultCode,
      payType: data.payType,
      responseTime: data.responseTime,
      paymentOption: data.paymentOption,
      promotionInfo: data.promotionInfo,
    });
  } catch (error) {
    console.error("POST /api/payment/query-momo thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi truy vấn trạng thái từ MoMo" },
      { status: 500 }
    );
  }
}

