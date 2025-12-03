import { NextResponse } from "next/server";
import crypto from "crypto";
import { upsertOrder, getOrder, OrderRecord } from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";

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

export async function POST(req: Request) {
  try {
    // Log raw body for debugging
    const rawBody = await req.text();
    console.log("📥 MoMo IPN received - Raw body:", rawBody);
    
    let body: MoMoIPNBody;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("❌ Failed to parse IPN body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON body", details: parseError instanceof Error ? parseError.message : "Unknown error" },
        { status: 400 }
      );
    }

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

    console.log("📥 MoMo IPN parsed:", {
      partnerCode,
      orderId,
      hasSignature: !!signature,
      resultCode,
      amount,
    });

    // Validate required fields
    if (!partnerCode || !orderId || !signature) {
      console.error("❌ Missing required fields:", {
        hasPartnerCode: !!partnerCode,
        hasOrderId: !!orderId,
        hasSignature: !!signature,
      });
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc", details: { partnerCode: !!partnerCode, orderId: !!orderId, signature: !!signature } },
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
      console.error("❌ Invalid signature from MoMo IPN:", {
        orderId,
        received: signature?.substring(0, 20) + "...",
        expected: expected?.substring(0, 20) + "...",
        rawSignature,
      });
      return NextResponse.json(
        { error: "Invalid signature", orderId },
        { status: 400 }
      );
    }
    
    console.log("✅ Signature verified successfully for order:", orderId);

    // Process payment result
    if (resultCode === 0) {
      // Payment successful
      console.log("Thanh toán thành công:", {
        orderId,
        transId,
        amount,
        message,
      });

      // Lấy order hiện tại trước khi update để giữ lại thông tin đầy đủ
      // Trên Vercel, file system là read-only nên có thể trả về null
      let existingOrder: OrderRecord | null = null;
      try {
        existingOrder = await getOrder(orderId);
      } catch (fileError) {
        console.warn("⚠️ Could not read order from file system (expected on Vercel):", fileError);
      }
      
      // Kiểm tra xem đã sync chưa TRƯỚC KHI update (tránh race condition)
      // Trên Vercel, sheetsSyncedAt check có thể không hoạt động, nhưng vẫn thử
      if (existingOrder?.sheetsSyncedAt) {
        console.log("⏭️ Order already synced to Google Sheets (IPN), skipping:", orderId);
        // Vẫn update status và transId nhưng không sync lại
        try {
          await upsertOrder(orderId, {
            status: "PAID",
            amount,
            transId,
            serviceName: existingOrder?.serviceName,
            formData: existingOrder?.formData,
          });
        } catch (fileError) {
          console.warn("⚠️ Could not update order (expected on Vercel):", fileError);
        }
        return NextResponse.json({
          message: "IPN received - already synced",
          resultCode: 0,
        });
      }
      
      // QUAN TRỌNG: Trên Vercel, IPN có thể được gọi trước khi client-side sync
      // Nếu không có formData, KHÔNG sync (để client-side sync làm việc đó với đầy đủ thông tin)
      if (!existingOrder?.formData) {
        console.log("⚠️ IPN: No formData found, skipping sync. Client-side sync will handle it:", orderId);
        // Vẫn update status để đánh dấu đã thanh toán
        try {
          await upsertOrder(orderId, {
            status: "PAID",
            amount,
            transId,
          });
        } catch (fileError) {
          console.warn("⚠️ Could not update order (expected on Vercel):", fileError);
        }
        return NextResponse.json({
          message: "IPN received - waiting for client-side sync with formData",
          resultCode: 0,
        });
      }
      
      const updatedRecord: OrderRecord = {
        status: "PAID",
        amount,
        transId,
        // Giữ lại serviceName và formData từ order cũ
        serviceName: existingOrder?.serviceName,
        formData: existingOrder?.formData,
        updatedAt: new Date().toISOString(),
      };

      try {
        await upsertOrder(orderId, updatedRecord);
      } catch (fileError) {
        console.warn("⚠️ Could not persist order locally (expected on Vercel):", fileError);
      }

      console.log("Updated order record (IPN):", {
        orderId,
        status: updatedRecord.status,
        hasServiceName: !!updatedRecord.serviceName,
        hasFormData: !!updatedRecord.formData,
      });

      // Double-check trước khi sync (tránh race condition với client-side sync)
      // Trên Vercel có thể không check được, nhưng vẫn thử
      try {
        const doubleCheckOrder = await getOrder(orderId);
        if (doubleCheckOrder?.sheetsSyncedAt) {
          console.log("⏭️ Order was synced by another process (IPN double-check), skipping:", orderId);
          return NextResponse.json({
            message: "IPN received - already synced by another process",
            resultCode: 0,
          });
        }
      } catch (fileError) {
        console.warn("⚠️ Could not double-check order (expected on Vercel):", fileError);
      }

      // Chỉ sync lên Google Sheets nếu có formData (quan trọng!)
      console.log("🔄 Syncing order to Google Sheets (IPN with formData):", orderId);
        const syncResult = await sendOrderToGoogleSheets(orderId, updatedRecord, amount, transId, message);
        
      // Nếu sync thành công, đánh dấu đã sync ngay lập tức
        if (syncResult.success) {
        try {
          await upsertOrder(orderId, {
            sheetsSyncedAt: new Date().toISOString(),
          });
          console.log("✅ Order synced to Google Sheets successfully (IPN):", orderId);
        } catch (fileError) {
          console.warn("⚠️ Could not update sheetsSyncedAt (expected on Vercel):", fileError);
          // Trên Vercel không thể lưu sheetsSyncedAt, nhưng đã sync lên Sheets rồi nên OK
        }
      } else {
        console.error("❌ Failed to sync order to Google Sheets (IPN):", orderId, syncResult.error);
      }

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

