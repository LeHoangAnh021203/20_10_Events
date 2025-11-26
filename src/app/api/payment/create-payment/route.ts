import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { orderId, amount } = await req.json();

    // Validate input
    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "Thiếu orderId hoặc amount" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Số tiền phải lớn hơn 0" },
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

    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (req.headers.get("origin") || `https://${req.headers.get("host") || "localhost:3000"}`);

    const redirectUrl = `${baseUrl}/payment/success`;
    const ipnUrl = `${baseUrl}/api/payment/momo-ipn`;
    const requestId = orderId;
    const orderInfo = `Thanh toan don hang ${orderId}`;
    const extraData = "";

    // Create signature
    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const body = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType: "captureWallet",
      signature,
    };

    // Determine MoMo API URL (sandbox or production)
    const momoApiUrl = process.env.MOMO_API_URL || 
      "https://test-payment.momo.vn/v2/gateway/api/create";

    // Log để debug (không log secret key)
    console.log("🔍 MoMo Payment Config:", {
      partnerCode: partnerCode ? `${partnerCode.substring(0, 4)}...` : "MISSING",
      accessKey: accessKey ? `${accessKey.substring(0, 4)}...` : "MISSING",
      secretKey: secretKey ? "SET" : "MISSING",
      momoApiUrl: momoApiUrl,
      baseUrl: baseUrl,
    });

    const res = await fetch(momoApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("MoMo API error:", data);
      return NextResponse.json(
        { error: "Không thể tạo thanh toán MoMo", details: data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST /api/payment/create-payment thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi tạo thanh toán" },
      { status: 500 }
    );
  }
}

