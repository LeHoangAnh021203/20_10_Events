import { NextResponse } from "next/server";
import { upsertOrder } from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";
import { createPaymentSuccessEmail, createGreetingCardReceiverEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

const FREE_SERVICE_LIMIT = 3;

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "");

interface QuotaWebhookResponse {
  success?: boolean;
  allowed?: boolean;
  usedCount?: number;
  remaining?: number;
  reason?: string;
  error?: string;
}

async function consumeServiceBasicQuota(senderPhone: string, orderId: string) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  if (!webhookUrl) {
    return {
      success: false,
      allowed: false,
      reason: "GOOGLE_SHEETS_WEB_APP_URL chưa được cấu hình",
    };
  }

  const normalizedSenderPhone = normalizePhone(senderPhone);
  if (!normalizedSenderPhone) {
    return {
      success: false,
      allowed: false,
      reason: "Số điện thoại không hợp lệ",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "consume_service_basic_quota",
        serviceKey: "service-basic",
        senderPhone: normalizedSenderPhone,
        orderId,
        limit: FREE_SERVICE_LIMIT,
      }),
    });

    const text = await response.text();
    let payload: QuotaWebhookResponse | null = null;
    try {
      payload = JSON.parse(text) as QuotaWebhookResponse;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return {
        success: false,
        allowed: false,
        reason:
          payload?.error ||
          payload?.reason ||
          `Quota webhook lỗi ${response.status}`,
      };
    }

    if (!payload || typeof payload.allowed !== "boolean") {
      return {
        success: false,
        allowed: false,
        reason:
          "Quota webhook chưa hỗ trợ action consume_service_basic_quota hoặc phản hồi sai định dạng",
      };
    }

    return {
      success: payload.success !== false,
      allowed: payload.allowed,
      usedCount: payload.usedCount,
      remaining: payload.remaining,
      reason: payload.reason,
    };
  } catch (error) {
    return {
      success: false,
      allowed: false,
      reason: error instanceof Error ? error.message : "Lỗi không xác định",
    };
  }
}

function isServiceBasic(serviceName: string) {
  const normalized = serviceName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    normalized.includes("dich vu cong them") ||
    normalized.includes("service-basic")
  );
}

interface SaveFreeOrderBody {
  orderId: string;
  serviceName: string;
  deviceId?: string;
  formData: {
    senderName: string;
    senderPhone: string;
    deviceId?: string;
    senderEmail?: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverEmail?: string;
    message?: string;
  };
}

export async function POST(req: Request) {
  try {
    const body: SaveFreeOrderBody = await req.json();
    const { orderId, serviceName, formData, deviceId } = body;

    if (!orderId || !serviceName || !formData) {
      return NextResponse.json(
        { error: "Thiếu orderId, serviceName hoặc formData" },
        { status: 400 }
      );
    }
    if (!formData.senderPhone) {
      return NextResponse.json(
        { error: "Thiếu số điện thoại người gửi" },
        { status: 400 }
      );
    }

    const normalizedDeviceId = (deviceId || formData.deviceId || "").trim();
    const enrichedFormData = {
      ...formData,
      deviceId: normalizedDeviceId,
    };

    if (isServiceBasic(serviceName)) {
      const quotaResult = await consumeServiceBasicQuota(
        enrichedFormData.senderPhone,
        orderId
      );

      if (!quotaResult.success && !quotaResult.allowed) {
        console.error("❌ Quota check failed:", quotaResult.reason);
        return NextResponse.json(
          {
            error:
              quotaResult.reason ||
              "Không thể kiểm tra giới hạn sử dụng dịch vụ cộng thêm",
            code: "QUOTA_CHECK_FAILED",
          },
          { status: 500 }
        );
      }

      if (!quotaResult.allowed) {
        return NextResponse.json(
          {
            error:
              "hệ thống đã ghi nhận bạn đang vượt quá số lần sử dụng dịch vụ cộng thêm là 3 lần. Vui lòng liên hệ hotline để biết thêm chi tiết hoặc nếu có sự nhầm lẫn nhé ạ!!!",
            code: "SERVICE_BASIC_LIMIT_EXCEEDED",
            usedCount: quotaResult.usedCount ?? 3,
            remaining: quotaResult.remaining ?? 0,
          },
          { status: 429 }
        );
      }
    }

    // Try to save to local file system (may fail on Vercel, that's OK)
    let record: Awaited<ReturnType<typeof upsertOrder>> | null = null;
    try {
      record = await upsertOrder(orderId, {
        status: "FREE",
        amount: 0,
        serviceName,
        formData: enrichedFormData,
      });
    } catch (fileError) {
      // On Vercel, file system writes may fail - that's OK, we'll still send to Google Sheets
      console.warn("⚠️ Could not save to local file system (expected on Vercel):", fileError);
      // Create a record object for Google Sheets even if file write failed
      record = {
        status: "FREE",
        amount: 0,
        serviceName,
        formData: enrichedFormData,
        updatedAt: new Date().toISOString(),
      };
    }

    // Always try to send to Google Sheets (this is the important part)
    const sheetsResult = await sendOrderToGoogleSheets(orderId, record, 0, undefined, "FREE ORDER");
    
    if (!sheetsResult.success) {
      console.warn("⚠️ Google Sheets sync failed:", sheetsResult.error);
      // Still return success if we at least tried - the order is still valid
    }

    // Send email notifications to both sender and receiver (in parallel)
    const emailPromises: Promise<void>[] = [];

    // Email to sender (voucher confirmation)
    if (enrichedFormData.senderEmail) {
      emailPromises.push(
        (async () => {
          try {
            const emailTemplate = createPaymentSuccessEmail({
              senderName: enrichedFormData.senderName,
              receiverName: enrichedFormData.receiverName || enrichedFormData.senderName,
              serviceName,
              orderId,
              amount: 0,
            });

            const emailResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: enrichedFormData.senderEmail,
                  subject: emailTemplate.subject,
                  html: emailTemplate.html,
                  senderName: enrichedFormData.senderName,
                  receiverName: enrichedFormData.receiverName || enrichedFormData.senderName,
                }),
              }
            );

            if (emailResponse.ok) {
              console.log("✅ Free voucher email sent to sender:", enrichedFormData.senderEmail);
            } else {
              console.warn("⚠️ Failed to send free voucher email to sender:", await emailResponse.text());
            }
          } catch (emailError) {
            console.error("❌ Error sending free voucher email to sender:", emailError);
          }
        })()
      );
    }

    // Email to receiver (greeting card notification)
    if (enrichedFormData.receiverEmail) {
      emailPromises.push(
        (async () => {
          try {
            const emailTemplate = createGreetingCardReceiverEmail({
              senderName: enrichedFormData.senderName,
              receiverName: enrichedFormData.receiverName || enrichedFormData.senderName,
              message: enrichedFormData.message,
              serviceName,
              orderId,
            });

            const emailResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: enrichedFormData.receiverEmail,
                  subject: emailTemplate.subject,
                  html: emailTemplate.html,
                  senderName: enrichedFormData.senderName,
                  receiverName: enrichedFormData.receiverName || enrichedFormData.senderName,
                }),
              }
            );

            if (emailResponse.ok) {
              console.log("✅ Greeting card email sent to receiver:", enrichedFormData.receiverEmail);
            } else {
              console.warn("⚠️ Failed to send greeting card email to receiver:", await emailResponse.text());
            }
          } catch (emailError) {
            console.error("❌ Error sending greeting card email to receiver:", emailError);
          }
        })()
      );
    }

    // Send all emails in parallel
    if (emailPromises.length > 0) {
      await Promise.all(emailPromises);
      console.log("✅ All free voucher emails sent successfully");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/payment/save-free-order thất bại:", error);
    return NextResponse.json(
      { error: "Không thể lưu thông tin đơn miễn phí" },
      { status: 500 }
    );
  }
}
