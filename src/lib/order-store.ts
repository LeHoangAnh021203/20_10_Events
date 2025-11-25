import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export interface OrderFormData {
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverEmail?: string;
  message?: string;
}

export interface OrderRecord {
  status: string;
  amount?: number;
  serviceName?: string;
  formData?: OrderFormData | null;
  transId?: string;
  updatedAt?: string;
  sheetsSyncedAt?: string; // Timestamp khi đã sync lên Google Sheets
}

const dataDir = join(process.cwd(), "data");
const ordersFile = join(dataDir, "orders.json");

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

export async function readOrders(): Promise<Record<string, OrderRecord>> {
  await ensureDataDir();
  try {
    const content = await readFile(ordersFile, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function writeOrders(orders: Record<string, OrderRecord>) {
  await ensureDataDir();
  await writeFile(ordersFile, JSON.stringify(orders, null, 2), "utf-8");
}

export async function getOrder(orderId: string): Promise<OrderRecord | null> {
  const orders = await readOrders();
  return orders[orderId] || null;
}

export async function upsertOrder(
  orderId: string,
  partial: Partial<OrderRecord>
): Promise<OrderRecord> {
  const orders = await readOrders();
  const existing = orders[orderId] || { status: "PENDING" };
  const updated: OrderRecord = {
    ...existing,
    ...partial,
    formData: partial.formData ?? existing.formData ?? null,
    updatedAt: new Date().toISOString(),
  };
  orders[orderId] = updated;
  await writeOrders(orders);
  return updated;
}

