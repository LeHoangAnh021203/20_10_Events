# Hướng dẫn tích hợp thanh toán MoMo

## Cấu hình môi trường

Tạo file `.env.local` trong thư mục `landingPage` với các biến sau:

```env
# MoMo Payment Configuration
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key

# MoMo API URL (optional - mặc định là sandbox)
# Sandbox: https://test-payment.momo.vn/v2/gateway/api/create
# Production: https://payment.momo.vn/v2/gateway/api/create
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create

# Base URL của website (optional - sẽ tự động detect từ request)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Lấy thông tin từ MoMo

1. Đăng ký tài khoản tại [MoMo Developer Portal](https://developers.momo.vn/)
2. Tạo ứng dụng và lấy:
   - `Partner Code`
   - `Access Key`
   - `Secret Key`

## Luồng thanh toán

### 1. Client tạo thanh toán

```typescript
import { initiateMoMoPayment } from "@/lib/momo-payment";

// Tạo orderId duy nhất (ví dụ: timestamp + random)
const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const amount = 100000; // Số tiền (VND)

// Gọi API và redirect
await initiateMoMoPayment({ orderId, amount });
```

### 2. MoMo xử lý

- MoMo redirect về `/payment/success` với query params
- MoMo gửi IPN webhook đến `/api/payment/momo-ipn`

### 3. Xử lý kết quả

- **Frontend**: Trang `/payment/success` hiển thị kết quả dựa trên `resultCode`
- **Backend**: API `/api/payment/momo-ipn` verify signature và cập nhật trạng thái đơn hàng

## API Endpoints

### POST `/api/payment/create-payment`

Tạo thanh toán MoMo.

**Request:**
```json
{
  "orderId": "ORDER_123456",
  "amount": 100000
}
```

**Response:**
```json
{
  "partnerCode": "...",
  "orderId": "ORDER_123456",
  "resultCode": 0,
  "message": "Success",
  "payUrl": "https://test-payment.momo.vn/...",
  "deeplink": "...",
  "qrCodeUrl": "..."
}
```

### POST `/api/payment/momo-ipn`

Webhook từ MoMo (không gọi trực tiếp).

**Request body:** (từ MoMo)
```json
{
  "partnerCode": "...",
  "orderId": "ORDER_123456",
  "resultCode": 0,
  "signature": "...",
  ...
}
```

## Lưu trữ đơn hàng

Hệ thống tự động lưu trạng thái đơn hàng vào file `data/orders.json`:

```json
{
  "ORDER_123456": {
    "status": "PAID",
    "transId": "...",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Testing

1. Sử dụng MoMo Sandbox để test
2. Test với số tiền nhỏ trước
3. Kiểm tra IPN webhook có được gọi đúng không
4. Verify signature trong IPN handler

## Production Checklist

- [ ] Cập nhật `MOMO_API_URL` sang production
- [ ] Cập nhật `NEXT_PUBLIC_BASE_URL` với domain thật
- [ ] Đảm bảo IPN URL có thể truy cập từ internet (public)
- [ ] Test toàn bộ luồng thanh toán
- [ ] Setup monitoring cho IPN webhook
- [ ] Backup và secure file `data/orders.json`

## Troubleshooting

### IPN không được gọi
- Kiểm tra IPN URL có public không
- Kiểm tra firewall/security settings
- Xem logs trong MoMo Developer Portal

### Signature không khớp
- Kiểm tra `MOMO_SECRET_KEY` có đúng không
- Đảm bảo thứ tự các field trong rawSignature đúng
- Kiểm tra encoding (UTF-8)

### Redirect không hoạt động
- Kiểm tra `redirectUrl` trong request
- Đảm bảo URL không có trailing slash
- Test với HTTPS (MoMo yêu cầu HTTPS cho production)

