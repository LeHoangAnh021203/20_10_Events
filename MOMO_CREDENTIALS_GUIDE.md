# Hướng Dẫn Lấy Thông Tin MoMo Credentials

## Tổng Quan

Để tích hợp thanh toán MoMo vào ứng dụng, bạn cần có các thông tin sau:

1. **MOMO_PARTNER_CODE** - Mã đối tác MoMo
2. **MOMO_ACCESS_KEY** - Khóa truy cập API
3. **MOMO_SECRET_KEY** - Khóa bí mật để ký chữ ký
4. **MOMO_API_URL** - URL API của MoMo (sandbox hoặc production)
5. **NEXT_PUBLIC_BASE_URL** - URL của website của bạn

## Các Bước Để Lấy Thông Tin

### Bước 1: Đăng Ký Tài Khoản MoMo

1. Truy cập [MoMo Developer Portal](https://developers.momo.vn/)
2. Đăng ký tài khoản nếu chưa có
3. Điền đầy đủ thông tin doanh nghiệp và xác thực

### Bước 2: Tạo Ứng Dụng (App) Mới

1. Đăng nhập vào [MoMo Developer Portal](https://developers.momo.vn/)
2. Vào mục **"Ứng dụng"** hoặc **"Applications"**
3. Click **"Tạo ứng dụng mới"** hoặc **"Create New App"**
4. Điền thông tin:
   - **Tên ứng dụng**: Tên của dự án của bạn (ví dụ: "Face Wash Fox Landing Page")
   - **Mô tả**: Mô tả ngắn gọn về ứng dụng
   - **Redirect URL**: URL sẽ redirect sau khi thanh toán thành công (ví dụ: `https://yourdomain.com/payment/success`)
   - **IPN URL**: URL để MoMo gửi thông báo thanh toán (ví dụ: `https://yourdomain.com/api/payment/momo-ipn`)

### Bước 3: Lấy Thông Tin Credentials

Sau khi tạo ứng dụng thành công, bạn sẽ nhận được:

1. **Partner Code (MOMO_PARTNER_CODE)**
   - Đây là mã đối tác của bạn
   - Có dạng: `MOMOXXXX` (ví dụ: `MOMO1234`)
   - Copy mã này

2. **Access Key (MOMO_ACCESS_KEY)**
   - Khóa truy cập API
   - Dùng để xác thực các request đến MoMo
   - Copy khóa này

3. **Secret Key (MOMO_SECRET_KEY)**
   - Khóa bí mật để tạo chữ ký
   - **QUAN TRỌNG**: Giữ bí mật, không chia sẻ công khai
   - Dùng để tạo và xác thực chữ ký SHA256
   - Copy khóa này

### Bước 4: Xác Định Môi Trường

MoMo cung cấp 2 môi trường:

#### **Sandbox (Môi Trường Test)**
- Dùng để test trước khi chuyển sang production
- URL: `https://test-payment.momo.vn/v2/gateway/api/create`
- Thẻ test: Dùng thẻ test do MoMo cung cấp

#### **Production (Môi Trường Thật)**
- Dùng khi website đã sẵn sàng
- URL: `https://payment.momo.vn/v2/gateway/api/create`
- Chỉ hoạt động sau khi đã được MoMo phê duyệt

### Bước 5: Cấu Hình Biến Môi Trường

Tạo file `.env.local` trong thư mục `landingPage/` với nội dung:

```env
# MoMo Payment Configuration
MOMO_PARTNER_CODE=MOMOXXXX
MOMO_ACCESS_KEY=your_access_key_here
MOMO_SECRET_KEY=your_secret_key_here

# MoMo API URL (chọn một trong hai)
# Cho môi trường test:
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create

# Cho môi trường production:
# MOMO_API_URL=https://payment.momo.vn/v2/gateway/api/create

# Base URL của website
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Google Sheets Webhook URL (nếu dùng Google Sheets để lưu đơn hàng)
GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Lưu ý:**
- Thay `MOMOXXXX` bằng Partner Code thật của bạn
- Thay `your_access_key_here` bằng Access Key thật
- Thay `your_secret_key_here` bằng Secret Key thật
- Thay `https://yourdomain.com` bằng domain thật của bạn
- **KHÔNG** commit file `.env.local` lên Git (đã có trong `.gitignore`)

### Bước 6: Cấu Hình Trên Vercel (Nếu Deploy)

Nếu bạn deploy lên Vercel:

1. Vào **Settings** → **Environment Variables**
2. Thêm từng biến:
   - `MOMO_PARTNER_CODE` = `MOMOXXXX`
   - `MOMO_ACCESS_KEY` = `your_access_key_here`
   - `MOMO_SECRET_KEY` = `your_secret_key_here`
   - `MOMO_API_URL` = `https://test-payment.momo.vn/v2/gateway/api/create` (hoặc production URL)
   - `NEXT_PUBLIC_BASE_URL` = `https://yourdomain.vercel.app`
   - `GOOGLE_SHEETS_WEB_APP_URL` = `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`

3. Chọn môi trường: **Production**, **Preview**, **Development** (hoặc tất cả)

### Bước 7: Xác Thực Cấu Hình

Sau khi cấu hình xong:

1. Test trong môi trường sandbox trước
2. Kiểm tra xem IPN URL có hoạt động không:
   - MoMo sẽ gửi request đến IPN URL sau mỗi giao dịch
   - Đảm bảo IPN URL là HTTPS và có thể truy cập công khai
3. Kiểm tra logs để đảm bảo không có lỗi

## Lưu Ý Quan Trọng

1. **Bảo Mật Secret Key**:
   - Không bao giờ commit Secret Key lên Git
   - Không chia sẻ Secret Key công khai
   - Chỉ lưu trong biến môi trường

2. **IPN URL Phải Là HTTPS**:
   - MoMo chỉ chấp nhận IPN URL là HTTPS
   - Đảm bảo SSL certificate hợp lệ

3. **Test Trước Khi Production**:
   - Luôn test kỹ trong môi trường sandbox
   - Chỉ chuyển sang production khi đã test xong

4. **Monitoring & Logs**:
   - Theo dõi logs để phát hiện lỗi sớm
   - Kiểm tra đơn hàng trong Google Sheets hoặc database

## Tài Liệu Tham Khảo

- [MoMo Developer Documentation](https://developers.momo.vn/)
- [MoMo Payment Gateway API](https://developers.momo.vn/docs/payment/gateway/overview)

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console/server
2. Liên hệ MoMo Support qua Developer Portal
3. Xem tài liệu API chi tiết trên MoMo Developer Portal

