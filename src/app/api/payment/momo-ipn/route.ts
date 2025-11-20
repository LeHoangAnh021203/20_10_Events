import { NextResponse } from "next/server";
import crypto from "crypto";
import { OrderRecord, upsertOrder } from "@/lib/order-store";

export const runtime = "nodejs";

interface MoMoIPNBody {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: number;
  message: string;
  payType: string;
  extraData: string;
  signature: string;
  responseTime: number;
}

async function sendOrderToGoogleSheets(
  orderId: string,
  record: OrderRecord | null,
  amount: number,
  transId?: string,
  message?: string
) {
  try {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
    if (!webhookUrl) {
      console.warn("GOOGLE_SHEETS_WEB_APP_URL chưa được cấu hình");
      return;
    }

    const now = new Date();
    const vnDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const vnTime = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });
    const vnDateTime = `${vnDate} ${vnTime}`;

    const payload = {
      orderId,
      status: record?.status || "PAID",
      amount,
      transId: transId || record?.transId || "",
      message: message || "",
      serviceName: record?.serviceName || "",
      senderName: record?.formData?.senderName || "",
      senderPhone: record?.formData?.senderPhone || "",
      senderEmail: record?.formData?.senderEmail || "",
      receiverName: record?.formData?.receiverName || "",
      receiverPhone: record?.formData?.receiverPhone || "",
      receiverEmail: record?.formData?.receiverEmail || "",
      note: record?.formData?.message || "",
      updatedAt: vnDateTime,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Google Sheets webhook error:", response.status);
    } else {
      console.log("Order saved to Google Sheets:", orderId);
    }
  } catch (error) {
    console.error("Error sending order to Google Sheets:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body: MoMoIPNBody = await req.json();

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      extraData,
      signature,
      responseTime,
    } = body;

    // Validate required fields
    if (!partnerCode || !orderId || !signature) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const secretKey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;

    if (!secretKey || !accessKey) {
      console.error("Thiếu cấu hình MoMo: MOMO_SECRET_KEY, MOMO_ACCESS_KEY");
      return NextResponse.json(
        { error: "Máy chủ chưa cấu hình thanh toán MoMo" },
        { status: 500 }
      );
    }

    // Verify signature
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}&extraData=${extraData}&message=${message}` +
      `&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}` +
      `&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}` +
      `&resultCode=${resultCode}&transId=${transId}` +
      `&responseTime=${responseTime}`;

    const expected = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    if (signature !== expected) {
      console.error("Invalid signature from MoMo IPN:", {
        received: signature,
        expected,
        orderId,
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Process payment result
    if (resultCode === 0) {
      // Payment successful
      console.log("Thanh toán thành công:", {
        orderId,
        transId,
        amount,
        message,
      });

      const updatedRecord = await upsertOrder(orderId, {
        status: "PAID",
        amount,
        transId,
      });

      await sendOrderToGoogleSheets(orderId, updatedRecord, amount, transId, message);

      // Here you can add additional logic:
      // - Send confirmation email
      // - Trigger fulfillment process
      // - etc.
    } else {
      // Payment failed
      console.log("Thanh toán thất bại:", {
        orderId,
        resultCode,
        message,
      });

      await upsertOrder(orderId, {
        status: "FAILED",
        amount,
      });
    }

    // Always return success to MoMo (they will retry if we return error)
    return NextResponse.json({
      message: "IPN received",
      resultCode: 0,
    });
  } catch (error) {
    console.error("POST /api/payment/momo-ipn thất bại:", error);
    // Still return success to prevent MoMo from retrying
    return NextResponse.json(
      { message: "IPN received", resultCode: 0 },
      { status: 200 }
    );
  }
}

