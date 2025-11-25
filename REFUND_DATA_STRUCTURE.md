# Cấu trúc dữ liệu Refund trong Google Sheets

## Tổng quan

Khi thực hiện hoàn tiền (refund) thành công, hệ thống sẽ tự động gửi thông tin refund lên Google Sheets thông qua `GOOGLE_SHEETS_WEB_APP_URL`.

## Cấu trúc Payload Refund

Khi refund thành công, payload gửi lên Google Sheets có cấu trúc như sau:

```json
{
  "orderId": "ORDER_xxx",
  "status": "REFUNDED" hoặc "REFUNDED_PARTIAL",
  "amount": 200000,                    // Số tiền hoàn
  "transId": "2912345678",             // Mã giao dịch hoàn tiền (refund transaction ID)
  "originalTransId": "2912345677",     // Mã giao dịch gốc (original transaction ID)
  "originalAmount": 200000,            // Số tiền gốc đã thanh toán
  "message": "Hoàn tiền đơn hàng",
  "serviceName": "Cash Voucher 200k",
  "senderName": "Nguyễn Văn A",
  "senderPhone": "0912345678",
  "senderEmail": "sender@example.com",
  "receiverName": "Trần Thị B",
  "receiverPhone": "0987654321",
  "receiverEmail": "receiver@example.com",
  "note": "Lời chúc...",
  "refundDescription": "Khách hàng yêu cầu hoàn tiền",
  "updatedAt": "20/10/2024 15:30:00"
}
```

## Các trường dữ liệu

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| `orderId` | Mã đơn hàng gốc | `ORDER_1763698990244_xxx` |
| `status` | Trạng thái refund | `REFUNDED` (hoàn toàn bộ) hoặc `REFUNDED_PARTIAL` (hoàn một phần) |
| `amount` | Số tiền hoàn (VND) | `200000` |
| `transId` | Mã giao dịch hoàn tiền từ MoMo | `2912345678` |
| `originalTransId` | Mã giao dịch gốc từ giao dịch thanh toán ban đầu | `2912345677` |
| `originalAmount` | Số tiền gốc đã thanh toán (VND) | `200000` |
| `message` | Thông báo mặc định | `"Hoàn tiền đơn hàng"` |
| `serviceName` | Tên dịch vụ/gói voucher | `"Cash Voucher 200k"` |
| `senderName` | Tên người gửi | `"Nguyễn Văn A"` |
| `senderPhone` | SĐT người gửi | `"0912345678"` |
| `senderEmail` | Email người gửi | `"sender@example.com"` |
| `receiverName` | Tên người nhận | `"Trần Thị B"` |
| `receiverPhone` | SĐT người nhận | `"0987654321"` |
| `receiverEmail` | Email người nhận | `"receiver@example.com"` |
| `note` | Lời chúc từ form gốc | `"Lời chúc..."` |
| `refundDescription` | Mô tả lý do hoàn tiền | `"Khách hàng yêu cầu hoàn tiền"` |
| `updatedAt` | Thời gian hoàn tiền (VN timezone) | `"20/10/2024 15:30:00"` |

## Cấu trúc Google Sheet

### Option 1: Ghi vào cùng sheet với payment (Khuyến nghị)

Nếu bạn muốn ghi refund vào cùng sheet `momo` với payment, Apps Script cần xử lý cả 2 loại payload:

- **Payment payload**: Có `status` = `PAID` hoặc `FAILED`, không có `originalTransId`
- **Refund payload**: Có `status` = `REFUNDED` hoặc `REFUNDED_PARTIAL`, có `originalTransId`

**Cấu trúc cột sheet `momo` (mở rộng):**

| Cột | Tên | Mô tả |
|-----|-----|-------|
| A | Order ID | Mã đơn hàng |
| B | Status | `PAID`, `FAILED`, `REFUNDED`, `REFUNDED_PARTIAL` |
| C | Amount | Số tiền (payment hoặc refund) |
| D | Transaction ID | Mã giao dịch (payment hoặc refund) |
| E | Original Transaction ID | Mã giao dịch gốc (chỉ có khi refund) |
| F | Original Amount | Số tiền gốc (chỉ có khi refund) |
| G | Message | Thông báo |
| H | Service Name | Tên dịch vụ |
| I | Sender Name | Tên người gửi |
| J | Sender Phone | SĐT người gửi |
| K | Sender Email | Email người gửi |
| L | Receiver Name | Tên người nhận |
| M | Receiver Phone | SĐT người nhận |
| N | Receiver Email | Email người nhận |
| O | Note | Lời chúc |
| P | Refund Description | Lý do hoàn tiền (chỉ có khi refund) |
| Q | Updated At | Thời gian cập nhật |

### Option 2: Tách riêng sheet refund

Nếu bạn muốn tách riêng, có thể tạo sheet `refund` riêng và cập nhật Apps Script để:
- Nếu payload có `originalTransId` → ghi vào sheet `refund`
- Nếu không → ghi vào sheet `momo` như bình thường

## Cập nhật Apps Script

Để xử lý refund data, cần cập nhật Apps Script `doPost`:

```javascript
function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) return json({ success: false, error: 'Empty body' });

    const data = JSON.parse(raw);

    // Kiểm tra nếu là refund data (có originalTransId)
    if (data.originalTransId) {
      // Xử lý refund data
      return handleRefundData(data);
    }

    // Xử lý payment data như bình thường
    // ... existing code ...
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

function handleRefundData(data) {
  const sheet = getOrCreateSheet('momo', REFUND_HEADERS);
  
  const row = [
    data.orderId || '',
    data.status || 'REFUNDED',
    data.amount || '',
    data.transId || '',              // Refund transaction ID
    data.originalTransId || '',       // Original transaction ID
    data.originalAmount || '',        // Original amount
    data.message || '',
    data.serviceName || '',
    data.senderName || '',
    data.senderPhone || '',
    data.senderEmail || '',
    data.receiverName || '',
    data.receiverPhone || '',
    data.receiverEmail || '',
    data.note || '',
    data.refundDescription || '',
    data.updatedAt || new Date().toISOString()
  ];

  sheet.appendRow(row);
  return json({ success: true, message: 'Refund data saved' });
}
```

## Lưu ý

1. **Refund có thể xảy ra nhiều lần**: Một order có thể được refund nhiều lần (refund một phần), mỗi lần refund sẽ tạo một dòng mới trong sheet.

2. **Tracking refund**: Để track refund dễ dàng, có thể:
   - Filter theo `status` = `REFUNDED` hoặc `REFUNDED_PARTIAL`
   - Filter theo `originalTransId` để tìm tất cả refund của một giao dịch gốc
   - Sử dụng `orderId` để tìm tất cả refund của một order

3. **Validation**: Apps Script nên validate:
   - `originalTransId` phải tồn tại trong sheet (giao dịch gốc đã được ghi)
   - `amount` không được vượt quá `originalAmount`

## Testing

Để test refund data:

1. Thực hiện một giao dịch thanh toán thành công
2. Gọi API refund: `POST /api/payment/refund`
3. Kiểm tra Google Sheet xem có dòng refund mới không
4. Verify các trường dữ liệu đã đúng chưa

