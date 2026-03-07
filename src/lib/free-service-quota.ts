const FREE_SERVICE_LIMIT = 3;

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, "");

interface ConsumeQuotaResult {
  success: boolean;
  allowed: boolean;
  usedCount?: number;
  remaining?: number;
  reason?: string;
}

interface QuotaWebhookResponse {
  success?: boolean;
  allowed?: boolean;
  usedCount?: number;
  remaining?: number;
  reason?: string;
  error?: string;
}

export async function consumeServiceBasicQuota(
  senderPhone: string,
  orderId: string
): Promise<ConsumeQuotaResult> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL;
  if (!webhookUrl) {
    return {
      success: false,
      allowed: false,
      reason: "GOOGLE_SHEETS_WEB_APP_URL chưa được cấu hình",
    };
  }

  const normalizedSenderPhone = normalizePhone(senderPhone);
  if (!normalizedSenderPhone) {
    return {
      success: false,
      allowed: false,
      reason: "Số điện thoại không hợp lệ",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "consume_service_basic_quota",
        serviceKey: "service-basic",
        senderPhone: normalizedSenderPhone,
        orderId,
        limit: FREE_SERVICE_LIMIT,
      }),
    });

    const text = await response.text();
    let payload: QuotaWebhookResponse | null = null;
    try {
      payload = JSON.parse(text) as QuotaWebhookResponse;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return {
        success: false,
        allowed: false,
        reason:
          payload?.error ||
          payload?.reason ||
          `Quota webhook lỗi ${response.status}`,
      };
    }

    if (!payload || typeof payload.allowed !== "boolean") {
      return {
        success: false,
        allowed: false,
        reason:
          "Quota webhook chưa hỗ trợ action consume_service_basic_quota hoặc phản hồi sai định dạng",
      };
    }

    return {
      success: payload.success !== false,
      allowed: payload.allowed,
      usedCount: payload.usedCount,
      remaining: payload.remaining,
      reason: payload.reason,
    };
  } catch (error) {
    return {
      success: false,
      allowed: false,
      reason: error instanceof Error ? error.message : "Lỗi không xác định",
    };
  }
}

export function isServiceBasic(serviceName: string) {
  const normalized = serviceName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    normalized.includes("dich vu cong them") ||
    normalized.includes("service-basic")
  );
}

