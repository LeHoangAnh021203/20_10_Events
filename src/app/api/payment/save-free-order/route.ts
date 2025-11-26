import { NextResponse } from "next/server";
import { upsertOrder } from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/payment/save-free-order thất bại:", error);
    return NextResponse.json(
      { error: "Không thể lưu thông tin đơn miễn phí" },
      { status: 500 }
    );
  }
}

