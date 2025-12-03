import { NextResponse } from "next/server";
import { upsertOrder, OrderFormData } from "@/lib/order-store";

export const runtime = "nodejs";

interface SaveOrderBody {
  orderId: string;
  amount: number;
  serviceName?: string;
  formData: OrderFormData;
}

export async function POST(req: Request) {
  try {
    const body: SaveOrderBody = await req.json();

    if (!body?.orderId || !body?.amount || !body?.formData) {
      return NextResponse.json(
        { error: "Thiếu thông tin orderId, amount hoặc formData" },
        { status: 400 }
      );
    }

    // Try to save order locally (may fail on Vercel due to read-only filesystem)
    try {
    await upsertOrder(body.orderId, {
      status: "PENDING",
      amount: body.amount,
      serviceName: body.serviceName,
      formData: body.formData,
    });
      console.log("✅ Order saved locally:", body.orderId);
    } catch (fileError) {
      // On Vercel, filesystem is read-only - this is expected and OK
      // Data will be synced via sync-client or IPN instead
      console.warn("⚠️ Could not save order locally (expected on Vercel):", fileError);
      // Don't throw error - this is expected behavior on Vercel
    }

    // Always return success - data will be synced via sync-client or IPN
    return NextResponse.json({ 
      success: true,
      message: "Order data received (will be synced via sync-client or IPN)"
    });
  } catch (error) {
    console.error("POST /api/payment/save-order thất bại:", error);
    return NextResponse.json(
      { error: "Không thể lưu thông tin đơn hàng" },
      { status: 500 }
    );
  }
}

