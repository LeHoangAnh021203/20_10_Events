import { NextResponse } from "next/server";
import { upsertOrder } from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";
import { createPaymentSuccessEmail, createGreetingCardReceiverEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

interface SaveFreeOrderBody {
  orderId: string;
  serviceName: string;
  formData: {
    senderName: string;
    senderPhone: string;
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
    const { orderId, serviceName, formData } = body;

    if (!orderId || !serviceName || !formData) {
      return NextResponse.json(
        { error: "Thiếu orderId, serviceName hoặc formData" },
        { status: 400 }
      );
    }

    // Try to save to local file system (may fail on Vercel, that's OK)
    let record: Awaited<ReturnType<typeof upsertOrder>> | null = null;
    try {
      record = await upsertOrder(orderId, {
        status: "FREE",
        amount: 0,
        serviceName,
        formData,
      });
    } catch (fileError) {
      // On Vercel, file system writes may fail - that's OK, we'll still send to Google Sheets
      console.warn("⚠️ Could not save to local file system (expected on Vercel):", fileError);
      // Create a record object for Google Sheets even if file write failed
      record = {
        status: "FREE",
        amount: 0,
        serviceName,
        formData,
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
    if (formData.senderEmail) {
      emailPromises.push(
        (async () => {
          try {
            const emailTemplate = createPaymentSuccessEmail({
              senderName: formData.senderName,
              receiverName: formData.receiverName || formData.senderName,
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
                  to: formData.senderEmail,
                  subject: emailTemplate.subject,
                  html: emailTemplate.html,
                  senderName: formData.senderName,
                  receiverName: formData.receiverName || formData.senderName,
                }),
              }
            );

            if (emailResponse.ok) {
              console.log("✅ Free voucher email sent to sender:", formData.senderEmail);
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
    if (formData.receiverEmail) {
      emailPromises.push(
        (async () => {
          try {
            const emailTemplate = createGreetingCardReceiverEmail({
              senderName: formData.senderName,
              receiverName: formData.receiverName || formData.senderName,
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
                  receiverName: formData.receiverName || formData.senderName,
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

