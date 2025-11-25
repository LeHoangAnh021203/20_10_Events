import { NextResponse } from "next/server";
import { getOrder, upsertOrder } from "@/lib/order-store";
import crypto from "crypto";

export const runtime = "nodejs";

async function sendOrderToGoogleSheets(
  orderId: string,
  record: any,
  amount: number,
  transId?: string,
  message?: string
) {
  try {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
    if (!webhookUrl) {
      console.warn("GOOGLE_SHEETS_WEB_APP_URL chưa được cấu hình");
      return { success: false, error: "GOOGLE_SHEETS_WEB_APP_URL chưa được cấu hình" };
    }

    const now = new Date();
    const vnDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const vnTime = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });
    const vnDateTime = `${vnDate} ${vnTime}`;

    const payload = {
      orderId,
      status: record?.status || "PAID",
      amount,
      transId: transId || record?.transId || "",
      message: message || "",
      serviceName: record?.serviceName || "",
      senderName: record?.formData?.senderName || "",
      senderPhone: record?.formData?.senderPhone || "",
      senderEmail: record?.formData?.senderEmail || "",
      receiverName: record?.formData?.receiverName || "",
      receiverPhone: record?.formData?.receiverPhone || "",
      receiverEmail: record?.formData?.receiverEmail || "",
      note: record?.formData?.message || "",
      updatedAt: vnDateTime,
    };

    console.log("Sending order to Google Sheets:", {
      orderId,
      webhookUrl,
      payload: JSON.stringify(payload, null, 2),
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Google Sheets response:", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Google Sheets webhook error: ${response.status} - ${responseText}`,
      };
    }

    return { success: true, message: "Order synced to Google Sheets successfully" };
  } catch (error) {
    console.error("Error sending order to Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, force } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Thiếu orderId" },
        { status: 400 }
      );
    }

    // Lấy order từ database
    const order = await getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy order" },
        { status: 404 }
      );
    }

    // Kiểm tra xem đã sync chưa (trừ khi force sync)
    if (!force && order.sheetsSyncedAt) {
      return NextResponse.json({
        success: true,
        message: "Order đã được đồng bộ trước đó",
        orderId,
        syncedAt: order.sheetsSyncedAt,
      });
    }

    // Gửi lên Google Sheets
    const result = await sendOrderToGoogleSheets(
      orderId,
      order,
      order.amount || 0,
      order.transId,
      ""
    );

    if (result.success) {
      // Đánh dấu đã sync
      await upsertOrder(orderId, {
        sheetsSyncedAt: new Date().toISOString(),
      });
      
      return NextResponse.json({
        success: true,
        message: "Order đã được đồng bộ lên Google Sheets",
        orderId,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("POST /api/payment/sync-to-sheets thất bại:", error);
    return NextResponse.json(
      { error: "Lỗi khi đồng bộ order lên Google Sheets" },
      { status: 500 }
    );
  }
}

