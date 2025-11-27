import { OrderRecord } from "./order-store";

export async function sendOrderToGoogleSheets(
  orderId: string,
  record: OrderRecord | null,
  amount: number,
  transId?: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
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

    console.log("📤 Sending order to Google Sheets:", {
      orderId,
      webhookUrl: webhookUrl ? `${webhookUrl.substring(0, 50)}...` : "NOT SET",
      hasFormData: !!record?.formData,
      hasServiceName: !!record?.serviceName,
      payload: JSON.stringify(payload, null, 2),
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("📥 Google Sheets response:", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      const error = `Google Sheets webhook error: ${response.status} - ${responseText}`;
      console.error("❌", error);
      return { success: false, error };
    }

    console.log("✅ Order saved to Google Sheets successfully:", orderId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending order to Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendRefundToGoogleSheets(
  orderId: string,
  refundTransId: string,
  originalTransId: string,
  refundAmount: number,
  originalAmount: number,
  description: string,
  record: OrderRecord | null
): Promise<{ success: boolean; error?: string }> {
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

    // Payload cho refund - có thể ghi vào cùng sheet hoặc sheet riêng
    // Format: orderId, status (REFUNDED/REFUNDED_PARTIAL), amount (số tiền hoàn), 
    // transId (refund transId), originalTransId, originalAmount, description, 
    // serviceName, sender info, receiver info, note, updatedAt
    const payload = {
      orderId,
      status: refundAmount === originalAmount ? "REFUNDED" : "REFUNDED_PARTIAL",
      amount: refundAmount, // Số tiền hoàn
      transId: refundTransId, // Mã giao dịch hoàn tiền
      originalTransId, // Mã giao dịch gốc
      originalAmount, // Số tiền gốc
      message: description || "Hoàn tiền đơn hàng",
      serviceName: record?.serviceName || "",
      senderName: record?.formData?.senderName || "",
      senderPhone: record?.formData?.senderPhone || "",
      senderEmail: record?.formData?.senderEmail || "",
      receiverName: record?.formData?.receiverName || "",
      receiverPhone: record?.formData?.receiverPhone || "",
      receiverEmail: record?.formData?.receiverEmail || "",
      note: record?.formData?.message || "",
      refundDescription: description,
      updatedAt: vnDateTime,
    };

    console.log("📤 Sending refund to Google Sheets:", {
      orderId,
      refundTransId,
      refundAmount,
      webhookUrl,
      payload: JSON.stringify(payload, null, 2),
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("📥 Google Sheets response (refund):", {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      const error = `Google Sheets webhook error: ${response.status} - ${responseText}`;
      console.error("❌", error);
      return { success: false, error };
    }

    console.log("✅ Refund saved to Google Sheets successfully:", orderId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending refund to Google Sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

