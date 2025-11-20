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

    await upsertOrder(body.orderId, {
      status: "PENDING",
      amount: body.amount,
      serviceName: body.serviceName,
      formData: body.formData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/payment/save-order thất bại:", error);
    return NextResponse.json(
      { error: "Không thể lưu thông tin đơn hàng" },
      { status: 500 }
    );
  }
}

