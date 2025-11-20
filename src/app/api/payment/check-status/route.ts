import { NextResponse } from "next/server";
import { readOrders } from "@/lib/order-store";

export const runtime = "nodejs";

interface OrderStatus {
  status: string;
  transId?: string;
  updatedAt: string;
}

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

    try {
      const orders = await readOrders();
      const order = orders[orderId] as OrderStatus | undefined;

      if (!order) {
        return NextResponse.json({
          orderId,
          status: "PENDING",
          message: "Đơn hàng chưa được xử lý hoặc không tồn tại",
        });
      }

      return NextResponse.json({
        orderId,
        status: order.status,
        transId: order.transId,
        updatedAt: order.updatedAt,
        message:
          order.status === "PAID"
            ? "Thanh toán thành công"
            : order.status === "FAILED"
            ? "Thanh toán thất bại"
            : "Đang xử lý",
      });
    } catch (error) {
      console.error("Error reading order status:", error);
      return NextResponse.json({
        orderId,
        status: "PENDING",
        message: "Không thể đọc trạng thái đơn hàng. Vui lòng thử lại sau.",
      });
    }
  } catch (error) {
    console.error("GET /api/payment/check-status thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi kiểm tra trạng thái" },
      { status: 500 }
    );
  }
}

