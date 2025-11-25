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

    const record = await upsertOrder(orderId, {
      status: "FREE",
      amount: 0,
      serviceName,
      formData,
    });

    await sendOrderToGoogleSheets(orderId, record, 0, undefined, "FREE ORDER");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/payment/save-free-order thất bại:", error);
    return NextResponse.json(
      { error: "Không thể lưu thông tin đơn miễn phí" },
      { status: 500 }
    );
  }
}

