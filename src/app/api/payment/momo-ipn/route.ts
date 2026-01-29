import { NextResponse } from "next/server";
import crypto from "crypto";
import { upsertOrder, getOrder, OrderRecord } from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";
import { deserializeMoMoExtraData } from "@/lib/momo-extra-data";

const ipnVerboseLogging = process.env.MOMO_IPN_VERBOSE_LOG !== "false";
const logIpnVerbose = (...args: unknown[]) => {
  if (ipnVerboseLogging) {
    console.log("🧾 [MoMo IPN verbose]", ...args);
  }
};
const warnIpnVerbose = (...args: unknown[]) => {
  if (ipnVerboseLogging) {
    console.warn("🧾 [MoMo IPN verbose]", ...args);
  }
};
const errorIpnVerbose = (...args: unknown[]) => {
  if (ipnVerboseLogging) {
    console.error("🧾 [MoMo IPN verbose]", ...args);
  }
};
const summarizeOrder = (order?: OrderRecord | null) =>
  order
    ? {
        status: order.status,
        amount: order.amount,
        hasFormData: !!order.formData,
        serviceName: order.serviceName,
        sheetsSyncedAt: order.sheetsSyncedAt,
        updatedAt: order.updatedAt,
      }
    : null;

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
  const handlerStartedAt = Date.now();
  let requestOrderId: string | undefined;
  try {
    // Log raw body for debugging (use clone so we can still parse JSON)
    try {
      const rawBody = await req.clone().text();
      console.log("📥 MoMo IPN received - Raw body:", rawBody);
    } catch (rawError) {
      warnIpnVerbose("Unable to read raw IPN body:", rawError);
    }
    try {
      const headers = Object.fromEntries(req.headers.entries());
      logIpnVerbose("Request metadata", {
        method: req.method,
        url: req.url,
        headers,
        contentLength: headers["content-length"],
        userAgent: headers["user-agent"],
      });
    } catch (metadataError) {
      warnIpnVerbose("Unable to log IPN request metadata:", metadataError);
    }
    
    let body: MoMoIPNBody;
    try {
      body = (await req.json()) as MoMoIPNBody;
    } catch (parseError) {
      console.error("❌ Failed to parse IPN body:", parseError);
      errorIpnVerbose("IPN JSON parse error details", parseError);
      return NextResponse.json(
        {
          message: "IPN received",
          resultCode: 0,
        },
        { status: 200 }
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
    requestOrderId = orderId;
    logIpnVerbose("Parsed IPN body", body);

    const parsedExtraData = deserializeMoMoExtraData(extraData);
    const fallbackFormData = parsedExtraData?.formData ?? null;
    const fallbackServiceName = parsedExtraData?.serviceName ?? undefined;

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
      errorIpnVerbose("IPN missing fields detail", {
        partnerCode,
        orderId,
        hasSignature: !!signature,
      });
      return NextResponse.json(
        {
          message: "IPN received",
          resultCode: 0,
        },
        { status: 200 }
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

    console.log("🔑 MoMo credentials check:", {
      hasSecretKey: !!secretKey,
      hasAccessKey: !!accessKey,
      secretKeyLength: secretKey?.length || 0,
      accessKeyMatch: accessKey === "urT5rn4etaYlzsd2",
      partnerCodeFromRequest: partnerCode,
    });

    // Verify signature
    // Convert all values to string to ensure consistent format
    // Use ?? instead of || to handle 0 values correctly
    const transIdStr = String(transId ?? "");
    const amountStr = String(amount ?? "");
    const resultCodeStr = String(resultCode ?? "");
    const responseTimeStr = String(responseTime ?? "");
    
    // Build signature string - MoMo IPN signature uses alphabetical order
    // Format: accessKey=...&amount=...&extraData=...&message=...&orderId=...&orderInfo=...&orderType=...&partnerCode=...&payType=...&requestId=...&responseTime=...&resultCode=...&transId=...
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amountStr}` +
      `&extraData=${extraData || ""}` +
      `&message=${message || ""}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo || ""}` +
      `&orderType=${orderType || ""}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType || ""}` +
      `&requestId=${requestId || ""}` +
      `&responseTime=${responseTimeStr}` +
      `&resultCode=${resultCodeStr}` +
      `&transId=${transIdStr}`;

    console.log("🔐 Signature calculation:", {
      orderId,
      rawSignatureLength: rawSignature.length,
      transIdType: typeof transId,
      transIdStr,
      amountStr,
      resultCodeStr,
      rawSignaturePreview: rawSignature.substring(0, 100) + "...",
    });

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
        secretKeyFirst4: secretKey?.substring(0, 4) + "...",
        secretKeyLast4: "..." + secretKey?.substring(secretKey.length - 4),
      });
      
      // In test mode, allow skipping signature verification for debugging
      // Remove this in production!
      const skipSignatureCheck = process.env.MOMO_SKIP_SIGNATURE_CHECK === "true";
      if (skipSignatureCheck) {
        console.warn("⚠️ SKIPPING signature verification (test mode only!)");
      } else {
      return NextResponse.json(
          {
            message: "IPN received",
            resultCode: 0,
          },
        { status: 200 }
      );
      }
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
        logIpnVerbose("Existing order snapshot", summarizeOrder(existingOrder));
      } catch (fileError) {
        console.warn("⚠️ Could not read order from file system (expected on Vercel):", fileError);
        warnIpnVerbose("getOrder failure details", fileError);
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
      const mergedFormData = existingOrder?.formData ?? fallbackFormData ?? null;
      const mergedServiceName =
        existingOrder?.serviceName ?? fallbackServiceName ?? undefined;

      if (!mergedFormData) {
        console.log("⚠️ IPN: No formData found, skipping sync. Client-side sync will handle it:", orderId);
        // Vẫn update status để đánh dấu đã thanh toán
        try {
          await upsertOrder(orderId, {
            status: "PAID",
            amount,
            transId,
            formData: mergedFormData,
            serviceName: mergedServiceName,
          });
        } catch (fileError) {
          console.warn("⚠️ Could not update order (expected on Vercel):", fileError);
          warnIpnVerbose("upsertOrder failure (no formData branch)", fileError);
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
        serviceName: mergedServiceName,
        formData: mergedFormData,
        updatedAt: new Date().toISOString(),
      };

      try {
        await upsertOrder(orderId, updatedRecord);
      } catch (fileError) {
        console.warn("⚠️ Could not persist order locally (expected on Vercel):", fileError);
        warnIpnVerbose("upsertOrder failure (main branch)", fileError);
      }

      console.log("Updated order record (IPN):", {
        orderId,
        status: updatedRecord.status,
        hasServiceName: !!updatedRecord.serviceName,
        hasFormData: !!updatedRecord.formData,
      });
      logIpnVerbose("Updated order full payload", updatedRecord);

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
        logIpnVerbose("Double-check order snapshot", summarizeOrder(doubleCheckOrder));
      } catch (fileError) {
        console.warn("⚠️ Could not double-check order (expected on Vercel):", fileError);
        warnIpnVerbose("Double-check failure details", fileError);
      }

      // Chỉ sync lên Google Sheets nếu có formData (quan trọng!)
      console.log("🔄 Syncing order to Google Sheets (IPN with formData):", orderId);
        const syncResult = await sendOrderToGoogleSheets(orderId, updatedRecord, amount, transId, message);
        logIpnVerbose("Google Sheets sync result", syncResult);
        
      // Nếu sync thành công, đánh dấu đã sync ngay lập tức
        if (syncResult.success) {
        try {
          await upsertOrder(orderId, {
            sheetsSyncedAt: new Date().toISOString(),
          });
          console.log("✅ Order synced to Google Sheets successfully (IPN):", orderId);
        } catch (fileError) {
          console.warn("⚠️ Could not update sheetsSyncedAt (expected on Vercel):", fileError);
          warnIpnVerbose("sheetsSyncedAt update failure", fileError);
          // Trên Vercel không thể lưu sheetsSyncedAt, nhưng đã sync lên Sheets rồi nên OK
        }
      } else {
        console.error("❌ Failed to sync order to Google Sheets (IPN):", orderId, syncResult.error);
        errorIpnVerbose("Sync failure details", syncResult);
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
    errorIpnVerbose("Unhandled IPN error details", error);
    // Still return success to prevent MoMo from retrying
    return NextResponse.json(
      { message: "IPN received", resultCode: 0 },
      { status: 200 }
    );
  } finally {
    logIpnVerbose("IPN handler completed", {
      orderId: requestOrderId,
      durationMs: Date.now() - handlerStartedAt,
    });
  }
}
