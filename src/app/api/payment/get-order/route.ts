import { NextResponse } from "next/server";
import { getOrder } from "@/lib/order-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Thiếu orderId" },
        { status: 400 }
      );
    }

    const order = await getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderId,
      status: order.status,
      amount: order.amount,
      serviceName: order.serviceName,
      formData: order.formData,
      transId: order.transId,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/payment/get-order thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin đơn hàng" },
      { status: 500 }
    );
  }
}

