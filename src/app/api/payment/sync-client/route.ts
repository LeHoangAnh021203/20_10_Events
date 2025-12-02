import { NextResponse } from "next/server";
import {
  OrderFormData,
  OrderRecord,
  upsertOrder,
  getOrder,
} from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";
import { createPaymentSuccessEmail, createGreetingCardReceiverEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

interface SyncClientBody {
  orderId: string;
  amount?: number;
  status?: string;
  serviceName?: string;
  transId?: string;
  message?: string;
  formData: OrderFormData;
}

export async function POST(req: Request) {
  try {
    const body: SyncClientBody = await req.json();
    const {
      orderId,
      amount = 0,
      status = "PAID",
      serviceName,
      transId,
      message,
      formData,
    } = body;

    if (!orderId || !formData) {
      return NextResponse.json(
        { error: "Thiếu orderId hoặc formData" },
        { status: 400 }
      );
    }

    // Kiểm tra xem order đã được sync chưa để tránh duplicate
    // Check TRƯỚC KHI làm bất kỳ thao tác nào
    let existingOrder: OrderRecord | null = null;
    try {
      existingOrder = await getOrder(orderId);
    } catch (error) {
      console.warn("⚠️ Could not read existing order (expected on Vercel):", error);
    }

    // Nếu đã sync rồi, không sync lại (tránh duplicate)
    if (existingOrder?.sheetsSyncedAt) {
      console.log("⏭️ Order already synced to Google Sheets (sync-client), skipping:", orderId);
      return NextResponse.json({ 
        success: true, 
        message: "Order already synced",
        alreadySynced: true 
      });
    }

    const record: OrderRecord = {
      status,
      amount,
      serviceName,
      formData,
      transId,
    };

    try {
      await upsertOrder(orderId, record);
    } catch (error) {
      console.warn(
        "⚠️ Could not persist order locally (expected on Vercel):",
        error
      );
    }

    // Double-check trước khi sync (tránh race condition với IPN)
    try {
      const doubleCheckOrder = await getOrder(orderId);
      if (doubleCheckOrder?.sheetsSyncedAt) {
        console.log("⏭️ Order was synced by another process (sync-client double-check), skipping:", orderId);
        return NextResponse.json({ 
          success: true, 
          message: "Order already synced by another process",
          alreadySynced: true 
        });
      }
    } catch (error) {
      console.warn("⚠️ Could not double-check order (expected on Vercel):", error);
    }

    const result = await sendOrderToGoogleSheets(
      orderId,
      record,
      amount,
      transId,
      message
    );

    if (!result.success) {
      console.error("❌ Failed to sync to Google Sheets:", result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error || "Không thể đồng bộ Google Sheets" 
        },
        { status: 500 }
      );
    }

    // Đánh dấu đã sync thành công ngay lập tức
    try {
      await upsertOrder(orderId, {
        sheetsSyncedAt: new Date().toISOString(),
      });
      console.log("✅ Order synced to Google Sheets successfully (sync-client):", orderId);
    } catch (error) {
      console.warn("⚠️ Could not update sheetsSyncedAt (expected on Vercel):", error);
    }

    // Send email notifications to both sender and receiver (in parallel)
    const emailPromises: Promise<void>[] = [];

    // Email to sender (payment confirmation)
    if (formData.senderEmail) {
      emailPromises.push(
        (async () => {
          try {
            const emailTemplate = createPaymentSuccessEmail({
              senderName: formData.senderName,
              receiverName: formData.receiverName || "Người nhận",
              serviceName,
              orderId,
              amount,
            });

            const emailResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: formData.senderEmail,
                  subject: emailTemplate.subject,
                  html: emailTemplate.html,
                  senderName: formData.senderName,
                  receiverName: formData.receiverName,
                }),
              }
            );

            if (emailResponse.ok) {
              console.log("✅ Payment success email sent to sender:", formData.senderEmail);
            } else {
              console.warn("⚠️ Failed to send payment success email to sender:", await emailResponse.text());
            }
          } catch (emailError) {
            console.error("❌ Error sending payment success email to sender:", emailError);
          }
        })()
      );
    }

    // Email to receiver (greeting card notification)
    if (formData.receiverEmail) {
      emailPromises.push(
        (async () => {
          try {
            const emailTemplate = createGreetingCardReceiverEmail({
              senderName: formData.senderName,
              receiverName: formData.receiverName || "Người nhận",
              message: formData.message,
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
                  to: formData.receiverEmail,
                  subject: emailTemplate.subject,
                  html: emailTemplate.html,
                  senderName: formData.senderName,
                  receiverName: formData.receiverName,
                }),
              }
            );

            if (emailResponse.ok) {
              console.log("✅ Greeting card email sent to receiver:", formData.receiverEmail);
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
      console.log("✅ All payment confirmation emails sent successfully");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/payment/sync-client thất bại:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Không thể đồng bộ dữ liệu đơn hàng" 
      },
      { status: 500 }
    );
  }
}
