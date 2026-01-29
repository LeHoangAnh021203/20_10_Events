import { OrderFormData } from "./order-store";

const MAX_EXTRA_DATA_JSON_BYTES = 180;
const TRIMMABLE_FIELDS: Array<keyof OrderFormData | "serviceName"> = [
  "message",
  "receiverEmail",
  "senderEmail",
  "serviceName",
  "receiverName",
  "senderName",
];

const FIELD_LIMITS: Record<keyof OrderFormData | "serviceName", number> = {
  serviceName: 60,
  senderName: 40,
  senderPhone: 20,
  senderEmail: 60,
  receiverName: 40,
  receiverPhone: 20,
  receiverEmail: 60,
  message: 120,
};

function truncate(value: string, limit: number) {
  return value.trim().slice(0, limit);
}

function buildPayload(
  formData?: OrderFormData | null,
  serviceName?: string | null
): Record<string, string> {
  const payload: Record<string, string> = {};

  if (serviceName) {
    payload.serviceName = truncate(serviceName, FIELD_LIMITS.serviceName);
  }

  if (formData?.senderName) {
    payload.senderName = truncate(formData.senderName, FIELD_LIMITS.senderName);
  }
  if (formData?.senderPhone) {
    payload.senderPhone = truncate(formData.senderPhone, FIELD_LIMITS.senderPhone);
  }
  if (formData?.senderEmail) {
    payload.senderEmail = truncate(formData.senderEmail, FIELD_LIMITS.senderEmail);
  }
  if (formData?.receiverName) {
    payload.receiverName = truncate(
      formData.receiverName,
      FIELD_LIMITS.receiverName
    );
  }
  if (formData?.receiverPhone) {
    payload.receiverPhone = truncate(
      formData.receiverPhone,
      FIELD_LIMITS.receiverPhone
    );
  }
  if (formData?.receiverEmail) {
    payload.receiverEmail = truncate(
      formData.receiverEmail,
      FIELD_LIMITS.receiverEmail
    );
  }
  if (formData?.message) {
    payload.message = truncate(formData.message, FIELD_LIMITS.message);
  }

  return payload;
}

function enforceSizeLimit(payload: Record<string, string>) {
  let json = JSON.stringify(payload);
  while (
    Buffer.byteLength(json, "utf-8") > MAX_EXTRA_DATA_JSON_BYTES &&
    TRIMMABLE_FIELDS.some((field) => payload[field])
  ) {
    let reduced = false;
    for (const key of TRIMMABLE_FIELDS) {
      const value = payload[key];
      if (value && value.length > 1) {
        payload[key] = value.slice(0, Math.max(1, value.length - 5));
        if (!payload[key]) {
          delete payload[key];
        }
        reduced = true;
        break;
      }
    }
    if (!reduced) {
      break;
    }
    json = JSON.stringify(payload);
  }
  return json;
}

export function serializeFormDataForMoMo(
  formData?: OrderFormData | null,
  serviceName?: string | null
): string {
  if (!formData && !serviceName) {
    return "";
  }

  const payload = buildPayload(formData, serviceName);
  if (Object.keys(payload).length === 0) {
    return "";
  }

  const json = enforceSizeLimit(payload);
  return Buffer.from(json, "utf-8").toString("base64");
}

export interface ParsedMoMoExtraData {
  formData?: OrderFormData;
  serviceName?: string;
}

export function deserializeMoMoExtraData(
  extraData?: string | null
): ParsedMoMoExtraData | null {
  if (!extraData) {
    return null;
  }

  try {
    const decoded = Buffer.from(extraData, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    const result: ParsedMoMoExtraData = {};
    const formData: Partial<OrderFormData> = {};

    if (typeof parsed.serviceName === "string" && parsed.serviceName.trim()) {
      result.serviceName = parsed.serviceName.trim();
    }

    const assignField = (key: keyof OrderFormData) => {
      const value = parsed[key];
      if (typeof value === "string" && value.trim()) {
        formData[key] = value.trim();
      }
    };

    assignField("senderName");
    assignField("senderPhone");
    assignField("senderEmail");
    assignField("receiverName");
    assignField("receiverPhone");
    assignField("receiverEmail");
    assignField("message");

    if (Object.keys(formData).length > 0) {
      result.formData = formData as OrderFormData;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.warn("Không thể giải mã extraData từ MoMo:", error);
    return null;
  }
}
