# Cấu Trúc Dữ Liệu Google Sheets

Hệ thống lưu **2 loại dữ liệu** vào Google Sheets:

## 📋 Sheet 1: Form Submission Data (Thông Tin Form Gửi Thiệp)

**File**: `src/app/api/submit-gsheet/route.ts`  
**Khi nào lưu**: Khi người dùng submit form gửi thiệp chúc mừng trên trang chủ

### Cấu Trúc Sheet:

| Cột | Tên Trường | Mô Tả | Ví Dụ |
|-----|-----------|-------|-------|
| **A** | Tên người gửi | Họ và tên người gửi | `Nguyễn Văn A` |
| **B** | SĐT người gửi | Số điện thoại người gửi | `0939161502` |
| **C** | Email người gửi | Email người gửi (optional) | `email@example.com` |
| **D** | Tên người nhận | Họ và tên người nhận | `Trần Thị B` |
| **E** | SĐT người nhận | Số điện thoại người nhận | `0987654321` |
| **F** | Email người nhận | Email người nhận (optional) | `receiver@example.com` |
| **G** | Lời chúc | Nội dung lời chúc (max 100 từ) | `Chúc mừng ngày 20/10...` |
| **H** | Thời gian | Thời gian gửi (VN timezone) | `01/01/2024 10:30:45` |

### Setup Sheet 1:

1. Tạo Google Sheet mới
2. Đặt tên: `Form Submissions` hoặc `Thông Tin Form`
3. Tạo header (dòng 1):

```
A1: Tên người gửi
B1: SĐT người gửi
C1: Email người gửi
D1: Tên người nhận
E1: SĐT người nhận
F1: Email người nhận
G1: Lời chúc
H1: Thời gian
```

4. Tạo Google Apps Script với code xử lý array (như trong `GOOGLE_SHEETS_SETUP.md`)
5. Deploy Web App và copy URL vào biến: `GOOGLE_SHEETS_WEB_APP_URL` (hoặc tạo biến riêng: `GOOGLE_SHEETS_FORM_URL`)

---

## 💳 Sheet 2: Payment/Order Tracking (Theo Dõi Đơn Hàng Thanh Toán)

**File**: `src/app/api/payment/momo-ipn/route.ts`  
**Khi nào lưu**: Khi MoMo gửi IPN (Instant Payment Notification) sau mỗi giao dịch thanh toán

### Cấu Trúc Sheet:

| Cột | Tên Trường | Mô Tả | Ví Dụ |
|-----|-----------|-------|-------|
| **A** | Order ID | Mã đơn hàng (unique) | `ORDER_1763629819101_35ealvrco` |
| **B** | Status | Trạng thái thanh toán | `PAID`, `FAILED`, hoặc `PENDING` |
| **C** | Amount | Số tiền thanh toán (VND) | `200000` |
| **D** | Trans ID | Mã giao dịch từ MoMo | `2912345678` |
| **E** | Message | Thông báo từ MoMo | `Success` hoặc error message |
| **F** | Updated At | Thời gian cập nhật (VN timezone) | `01/01/2024 10:30:45` |

### Setup Sheet 2:

1. Tạo Google Sheet mới (hoặc dùng sheet khác)
2. Đặt tên: `Order Tracking` hoặc `Theo Dõi Đơn Hàng`
3. Tạo header (dòng 1):

```
A1: Order ID
B1: Status
C1: Amount
D1: Trans ID
E1: Message
F1: Updated At
```

4. Tạo Google Apps Script với code xử lý array (như trong `GOOGLE_SHEETS_SETUP.md`)
5. Deploy Web App và copy URL vào biến: `GOOGLE_SHEETS_PAYMENT_URL` (hoặc dùng chung với form URL)

---

## 🔄 Option: Dùng Chung 1 Sheet Hoặc Tách Riêng

### Option 1: Dùng Chung 1 Sheet (Đơn Giản)

**Ưu điểm**: Dễ quản lý, chỉ cần 1 Google Apps Script  
**Nhược điểm**: Dữ liệu lẫn lộn giữa form và payment

**Cấu trúc Sheet tổng hợp:**

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Type | Order ID | Status | Amount | Trans ID | Message | Sender Name | Sender Phone | Sender Email | Receiver Name | Receiver Phone | Receiver Email | Message | Updated At |

- **Type**: `FORM` hoặc `PAYMENT`
- Khi Type = `FORM`: Chỉ có dữ liệu từ cột G-M
- Khi Type = `PAYMENT`: Chỉ có dữ liệu từ cột B-F

### Option 2: Tách Riêng 2 Sheet (Khuyến Nghị)

**Ưu điểm**: Dữ liệu rõ ràng, dễ quản lý và phân tích  
**Nhược điểm**: Cần 2 Google Apps Script và 2 Web App URLs

**Cấu hình:**

```env
# Trong .env.local hoặc Vercel Environment Variables

# URL cho Form Submissions
GOOGLE_SHEETS_FORM_URL=https://script.google.com/macros/s/FORM_SCRIPT_ID/exec

# URL cho Payment Tracking
GOOGLE_SHEETS_PAYMENT_URL=https://script.google.com/macros/s/PAYMENT_SCRIPT_ID/exec
```

Sau đó cập nhật code:
- `src/app/api/submit-gsheet/route.ts` → dùng `GOOGLE_SHEETS_FORM_URL`
- `src/app/api/payment/momo-ipn/route.ts` → dùng `GOOGLE_SHEETS_PAYMENT_URL`

---

## 📊 Ví Dụ Dữ Liệu Thực Tế

### Sheet 1 - Form Submission:

| Tên người gửi | SĐT người gửi | Email người gửi | Tên người nhận | SĐT người nhận | Email người nhận | Lời chúc | Thời gian |
|--------------|--------------|----------------|---------------|---------------|----------------|----------|-----------|
| Nguyễn Văn A | 0939161502 | a@example.com | Trần Thị B | 0987654321 | b@example.com | Chúc mừng ngày 20/10! | 20/10/2024 14:30:00 |

### Sheet 2 - Payment Tracking:

| Order ID | Status | Amount | Trans ID | Message | Updated At |
|----------|--------|--------|----------|---------|------------|
| ORDER_1763629819101_35ealvrco | PAID | 200000 | 2912345678 | Success | 20/10/2024 14:35:00 |
| ORDER_1763629819102_abc123 | FAILED | 500000 | - | Insufficient balance | 20/10/2024 15:20:00 |

---

## 🎯 Khuyến Nghị

**Nên tách riêng 2 Sheet** vì:
1. Dễ quản lý và filter dữ liệu
2. Có thể phân tích riêng biệt: form submissions vs payment transactions
3. Dễ export và báo cáo
4. Không bị lẫn lộn dữ liệu

**Cách Setup Nhanh:**
1. Tạo 2 Google Sheets riêng biệt
2. Tạo 2 Google Apps Script (mỗi sheet 1 script)
3. Deploy 2 Web Apps
4. Copy 2 URLs vào 2 biến môi trường riêng
5. Cập nhật code để dùng đúng URL cho từng loại dữ liệu

---

## 🔍 Kiểm Tra Dữ Liệu

Sau khi setup xong:
1. Test submit form → Kiểm tra Sheet 1 có dữ liệu mới không
2. Test thanh toán → Kiểm tra Sheet 2 có dữ liệu mới không
3. Kiểm tra format dữ liệu có đúng không
4. Kiểm tra timezone (phải là VN timezone)


