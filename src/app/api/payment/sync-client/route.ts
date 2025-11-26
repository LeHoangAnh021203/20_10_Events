import { NextResponse } from "next/server";
import {
  OrderFormData,
  OrderRecord,
  upsertOrder,
} from "@/lib/order-store";
import { sendOrderToGoogleSheets } from "@/lib/google-sheets";

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

    const result = await sendOrderToGoogleSheets(
      orderId,
      record,
      amount,
      transId,
      message
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể đồng bộ Google Sheets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/payment/sync-client thất bại:", error);
    return NextResponse.json(
      { error: "Không thể đồng bộ dữ liệu đơn hàng" },
      { status: 500 }
    );
  }
}


