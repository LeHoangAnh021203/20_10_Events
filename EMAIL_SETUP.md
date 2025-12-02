# Email Service Setup Guide

Hệ thống đã được tích hợp tính năng gửi email tự động cho khách hàng khi:
1. **Thanh toán thành công**: Gửi email xác nhận thanh toán
2. **Gửi thiệp thành công**: Gửi email xác nhận thiệp đã được tạo và gửi

## Cấu hình Email Service

Hiện tại, email service đang ở chế độ development (chỉ log, không gửi thực sự). Để kích hoạt gửi email thực sự, bạn cần cấu hình một trong các dịch vụ email sau:

### Option 1: Resend (Khuyến nghị)

1. Đăng ký tài khoản tại [Resend.com](https://resend.com)
2. Tạo API key
3. Thêm vào file `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

4. Uncomment code trong `src/app/api/send-email/route.ts` (phần Resend)

### Option 2: SendGrid

1. Đăng ký tài khoản tại [SendGrid.com](https://sendgrid.com)
2. Tạo API key
3. Thêm vào file `.env.local`:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

4. Uncomment code trong `src/app/api/send-email/route.ts` (phần SendGrid)

### Option 3: SMTP Server (Nodemailer) ✅ Đã được cấu hình

1. ✅ Đã cài đặt nodemailer (hoàn tất)

2. Tạo file `.env.local` trong thư mục gốc và thêm các biến môi trường:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@facewashfox.com
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**Lưu ý cho Gmail:**
- Bạn cần bật Xác thực 2 bước (2-Step Verification)
- Tạo App Password tại: https://myaccount.google.com/apppasswords
- Sử dụng App Password (không phải mật khẩu thường) trong `SMTP_PASS`

**Các SMTP server khác:**
- **Outlook/Hotmail**: `smtp-mail.outlook.com`, port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, port `587`
- **Custom SMTP**: Sử dụng thông tin từ nhà cung cấp email của bạn

3. ✅ Code đã được cấu hình sẵn trong `src/app/api/send-email/route.ts`

## Email Templates

Email templates được định nghĩa trong `src/lib/email-templates.ts`:

- **Payment Success Email**: Gửi khi thanh toán thành công
- **Greeting Card Sent Email**: Gửi khi thiệp được tạo/gửi thành công

Bạn có thể tùy chỉnh nội dung email trong file này.

## Testing

**Trong môi trường development (chưa cấu hình SMTP):**
- Email sẽ chỉ được log ra console
- Hệ thống vẫn hoạt động bình thường, không bị lỗi

**Để test gửi email thực sự:**

1. Tạo file `.env.local` và thêm cấu hình SMTP (xem Option 3 ở trên)
2. Khởi động lại server: `npm run dev`
3. Test bằng cách:
   - Thanh toán một đơn hàng → Email xác nhận thanh toán sẽ được gửi
   - Tạo và download/chia sẻ một thiệp chúc mừng → Email xác nhận thiệp sẽ được gửi

**Kiểm tra logs:**
- Nếu cấu hình đúng, bạn sẽ thấy: `✅ SMTP server connection verified`
- Khi gửi email thành công: `✅ Email sent successfully`
- Nếu có lỗi: `❌ SMTP verification failed` hoặc `Error sending email`

## Lưu ý

- Email được gửi bất đồng bộ, không block flow chính của ứng dụng
- Nếu gửi email thất bại, hệ thống sẽ log lỗi nhưng không ảnh hưởng đến trải nghiệm người dùng
- Email chỉ được gửi một lần cho mỗi thiệp (tránh duplicate)

