# Tổng Quan Hệ Thống Thanh Toán MoMo

## Các Tính Năng Đã Hoàn Thiện

### ✅ 1. Kết Nối IPN Với Google Sheets

**File**: `src/app/api/payment/momo-ipn/route.ts`

- IPN handler đã được cập nhật để lưu đơn hàng vào Google Sheets
- Fallback lưu vào file JSON (`data/orders.json`) nếu Google Sheets không khả dụng
- Tự động lưu thông tin: Order ID, Status, Amount, Transaction ID, Message, Updated At

**Cấu hình cần thiết**:
- Biến môi trường: `GOOGLE_SHEETS_WEB_APP_URL`
- Xem hướng dẫn setup: `GOOGLE_SHEETS_SETUP.md`

### ✅ 2. Endpoint Kiểm Tra Trạng Thái Đơn Hàng

**File**: `src/app/api/payment/check-status/route.ts`

- API endpoint mới: `/api/payment/check-status?orderId=ORDER_ID`
- Trả về trạng thái đơn hàng: `PENDING`, `PAID`, hoặc `FAILED`
- Kèm theo Transaction ID và thời gian cập nhật

**Sử dụng**:
```javascript
const response = await fetch(`/api/payment/check-status?orderId=${orderId}`);
const data = await response.json();
// data: { orderId, status, transId, updatedAt, message }
```

### ✅ 3. Trang Kiểm Tra Trạng Thái Tự Động

**File**: `src/app/payment/status/page.tsx`

- Trang `/payment/status` đã được cập nhật với tính năng:
  - Tự động kiểm tra trạng thái đơn hàng mỗi 3 giây
  - Hiển thị trạng thái real-time với icon và màu sắc phù hợp
  - Dừng polling khi thanh toán thành công/thất bại
  - Hiển thị thông tin đơn hàng: Order ID, Transaction ID, thời gian cập nhật
  - Nút điều hướng thông minh dựa trên trạng thái:
    - `PAID`: "Tiếp tục chọn dịch vụ" và "Gửi thiệp chúc mừng"
    - `FAILED`/`PENDING`: "Làm mới trạng thái" và "Tiếp tục chọn dịch vụ"

### ✅ 4. QR Code Dynamic Từ MoMo API

**File**: `src/app/components/hero.tsx`

- QR code được tạo động từ `qrCodeUrl` hoặc `payUrl` từ MoMo API response
- Nếu MoMo trả về `qrCodeUrl`, sẽ dùng QR code đó
- Nếu không có `qrCodeUrl`, sẽ dùng `payUrl` để tạo QR code
- QR code hiển thị trong popup thanh toán cùng với thông tin người gửi

### ✅ 5. Flow Resend Thiệp

**Flow hoạt động**:
1. Người dùng thanh toán thành công
2. Chuyển đến trang `/payment/status`
3. Khi status = `PAID`, hiển thị nút "Gửi thiệp chúc mừng"
4. Bấm vào nút → chuyển đến `/?showGreetingCard=1`
5. Trang chủ tự động load formData từ `sessionStorage` và hiển thị thiệp

**Files liên quan**:
- `src/app/page.tsx`: Xử lý query `showGreetingCard=1` và load formData
- `src/app/components/greeting-card.tsx`: Hiển thị thiệp với dữ liệu từ formData

## Cấu Hình Biến Môi Trường

Tạo file `.env.local` trong thư mục `landingPage/`:

```env
# MoMo Payment Configuration
MOMO_PARTNER_CODE=MOMOXXXX
MOMO_ACCESS_KEY=your_access_key_here
MOMO_SECRET_KEY=your_secret_key_here
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create

# Base URL của website
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Google Sheets Webhook URL (optional - nếu dùng Google Sheets)
GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Lấy thông tin MoMo credentials**: Xem `MOMO_CREDENTIALS_GUIDE.md`

## Luồng Thanh Toán Hoàn Chỉnh

1. **Chọn Voucher** → Người dùng chọn voucher trên trang `/voucher` hoặc trang chủ
2. **Nhập Thông Tin** → Người dùng nhập thông tin người gửi/nhận (trang chủ)
3. **Thanh Toán** → Bấm "Thanh Toán Ngay" → Mở popup thanh toán:
   - Hiển thị thông tin voucher
   - Hiển thị thông tin người gửi (từ sessionStorage)
   - Hiển thị QR code MoMo
   - Hiển thị thông tin tài khoản Face Wash Fox
4. **Chọn Phương Thức Thanh Toán**:
   - **Option 1**: Quét QR code MoMo → Thanh toán trong app MoMo
   - **Option 2**: Bấm "Thanh toán MoMo" → Mở app MoMo/web MoMo
5. **Kiểm Tra Trạng Thái** → Sau khi thanh toán, bấm "Kiểm tra trạng thái thanh toán":
   - Chuyển đến `/payment/status?orderId=ORDER_ID`
   - Trang tự động check trạng thái mỗi 3 giây
   - Hiển thị trạng thái real-time
6. **Sau Khi Thanh Toán Thành Công**:
   - **Option A**: "Tiếp tục chọn dịch vụ" → Chuyển đến `/voucher`
   - **Option B**: "Gửi thiệp chúc mừng" → Chuyển đến `/?showGreetingCard=1` → Hiển thị thiệp
7. **IPN Handler** → MoMo gửi thông báo đến `/api/payment/momo-ipn`:
   - Xác thực signature
   - Lưu vào Google Sheets (nếu có)
   - Lưu vào file JSON (backup)
   - Cập nhật trạng thái: `PAID` hoặc `FAILED`

## API Endpoints

### 1. Tạo Thanh Toán
- **Endpoint**: `POST /api/payment/create-payment`
- **Body**: `{ orderId, amount }`
- **Response**: `{ resultCode, payUrl?, qrCodeUrl?, ... }`

### 2. Nhận IPN từ MoMo
- **Endpoint**: `POST /api/payment/momo-ipn`
- **Body**: MoMo IPN payload (từ MoMo)
- **Response**: `{ message: "IPN received", resultCode: 0 }`

### 3. Kiểm Tra Trạng Thái Đơn Hàng
- **Endpoint**: `GET /api/payment/check-status?orderId=ORDER_ID`
- **Response**: `{ orderId, status, transId?, updatedAt?, message }`

## Files Đã Tạo/Cập Nhật

### Files Mới:
- ✅ `src/app/api/payment/check-status/route.ts` - API check trạng thái
- ✅ `MOMO_CREDENTIALS_GUIDE.md` - Hướng dẫn lấy thông tin MoMo
- ✅ `GOOGLE_SHEETS_SETUP.md` - Hướng dẫn setup Google Sheets
- ✅ `PAYMENT_SYSTEM_SUMMARY.md` - File này

### Files Đã Cập Nhật:
- ✅ `src/app/api/payment/momo-ipn/route.ts` - Kết nối Google Sheets
- ✅ `src/app/payment/status/page.tsx` - Auto check trạng thái
- ✅ `src/app/components/hero.tsx` - QR code dynamic, nút check status
- ✅ `src/app/page.tsx` - Flow resend thiệp

## Testing Checklist

Trước khi deploy production:

- [ ] Test tạo thanh toán trong sandbox MoMo
- [ ] Test IPN handler nhận thông báo từ MoMo
- [ ] Test lưu vào Google Sheets (nếu có)
- [ ] Test check trạng thái đơn hàng
- [ ] Test trang `/payment/status` tự động update
- [ ] Test QR code hiển thị đúng
- [ ] Test flow "Gửi thiệp chúc mừng"
- [ ] Kiểm tra biến môi trường đã cấu hình đầy đủ
- [ ] Test trên production environment (sau khi deploy)

## Deployment Notes

1. **Vercel**:
   - Thêm tất cả biến môi trường trong Settings → Environment Variables
   - Đảm bảo `NEXT_PUBLIC_BASE_URL` đúng với domain của bạn
   - Đảm bảo IPN URL (`/api/payment/momo-ipn`) có thể truy cập công khai (HTTPS)

2. **Google Sheets**:
   - Deploy Google Apps Script như Web App
   - Copy Web App URL vào biến môi trường `GOOGLE_SHEETS_WEB_APP_URL`
   - Test webhook hoạt động đúng

3. **MoMo**:
   - Đăng ký tài khoản và lấy credentials
   - Test trong sandbox trước
   - Chỉ chuyển sang production sau khi test xong

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console/server
2. Kiểm tra biến môi trường đã cấu hình đúng chưa
3. Xem các file hướng dẫn:
   - `MOMO_CREDENTIALS_GUIDE.md`
   - `GOOGLE_SHEETS_SETUP.md`
4. Liên hệ MoMo Support nếu vấn đề liên quan đến MoMo API

