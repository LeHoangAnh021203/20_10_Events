import { NextResponse } from "next/server";
import { readOrders } from "@/lib/order-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const senderPhone = searchParams.get("senderPhone");

    if (!senderPhone) {
      return NextResponse.json(
        { error: "Thiếu số điện thoại người gửi" },
        { status: 400 }
      );
    }

    // Normalize phone number for comparison (remove spaces, dashes, etc.)
    const normalizePhone = (phone: string) => {
      return phone.replace(/[\s\-()]/g, "");
    };
    
    const normalizedSenderPhone = normalizePhone(senderPhone);

    // Đọc tất cả orders
    const orders = await readOrders();
    
    // Tìm tất cả orders đã thanh toán thành công với senderPhone khớp
    const paidOrders: Array<{
      orderId: string;
      serviceName: string;
      amount?: number;
      transId?: string;
      updatedAt?: string;
    }> = [];
    
    for (const [orderId, order] of Object.entries(orders)) {
      const normalizedOrderPhone = order.formData?.senderPhone 
        ? normalizePhone(order.formData.senderPhone) 
        : "";
      
      if (
        order.status === "PAID" && 
        normalizedOrderPhone === normalizedSenderPhone &&
        order.serviceName
      ) {
        paidOrders.push({
          orderId,
          serviceName: order.serviceName,
          amount: order.amount,
          transId: order.transId,
          updatedAt: order.updatedAt,
        });
      }
    }
    
    console.log(`Found ${paidOrders.length} paid orders for senderPhone: ${senderPhone}`);
    paidOrders.forEach((order, idx) => {
      console.log(`Order ${idx}: ${order.orderId}, serviceName: ${order.serviceName}, updatedAt: ${order.updatedAt}`);
    });
    
    // Sắp xếp theo thời gian (mới nhất trước) và lấy order mới nhất
    let paidService = null;
    if (paidOrders.length > 0) {
      paidOrders.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA; // Mới nhất trước
      });
      paidService = paidOrders[0];
      console.log(`Selected latest order: ${paidService.orderId}, serviceName: ${paidService.serviceName}`);
    }

    if (!paidService) {
      return NextResponse.json({
        serviceName: null,
        message: "Không tìm thấy dịch vụ đã thanh toán cho số điện thoại này"
      });
    }

    return NextResponse.json({
      serviceName: paidService.serviceName,
      orderId: paidService.orderId,
      amount: paidService.amount,
      transId: paidService.transId,
      updatedAt: paidService.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/get-paid-service thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy thông tin dịch vụ đã thanh toán" },
      { status: 500 }
    );
  }
}
