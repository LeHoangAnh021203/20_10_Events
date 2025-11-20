# Hướng Dẫn Setup Google Sheets Cho Order Tracking

## Tổng Quan

Hệ thống sẽ lưu thông tin đơn hàng vào Google Sheets để bạn có thể theo dõi và quản lý đơn hàng dễ dàng.

## Các Bước Setup

### Bước 1: Tạo Google Sheet Mới

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo một Google Sheet mới
3. Đặt tên sheet: `Order Tracking` hoặc tên bạn muốn
4. Tạo header cho các cột:

   | A | B | C | D | E | F |
   |---|---||---||---||---|
   | Order ID | Status | Amount | Trans ID | Message | Updated At |

   - **Cột A**: Order ID (Mã đơn hàng)
   - **Cột B**: Status (Trạng thái: PAID/FAILED/PENDING)
   - **Cột C**: Amount (Số tiền)
   - **Cột D**: Trans ID (Mã giao dịch MoMo)
   - **Cột E**: Message (Thông báo)
   - **Cột F**: Updated At (Thời gian cập nhật)

### Bước 2: Tạo Google Apps Script

1. Trong Google Sheet, click vào **Extensions** → **Apps Script**
2. Xóa code mặc định và dán code sau:

```javascript
function doPost(e) {
  try {
    // Lấy sheet hiện tại
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse dữ liệu từ request
    const data = JSON.parse(e.postData.contents);
    
    // Kiểm tra xem data có phải là array không
    if (Array.isArray(data)) {
      // Nếu là array, thêm dòng mới
      sheet.appendRow(data);
      
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: "Data saved successfully" })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Nếu là object, thêm dòng mới từ các field
      const row = [
        data.orderId || '',
        data.status || '',
        data.amount || 0,
        data.transId || '',
        data.message || '',
        data.updatedAt || new Date().toISOString()
      ];
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: "Data saved successfully" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log("Error: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ message: "This is a POST-only webhook" })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

3. Lưu script (Ctrl+S hoặc Cmd+S)
4. Đặt tên project: `Order Tracking Webhook`

### Bước 3: Deploy Web App

1. Click vào **Deploy** → **New deployment**
2. Click vào biểu tượng bánh răng ⚙️ (Select type) → chọn **Web app**
3. Điền thông tin:
   - **Description**: `Order Tracking Webhook v1`
   - **Execute as**: Chọn **Me** (tài khoản của bạn)
   - **Who has access**: Chọn **Anyone** (bất kỳ ai cũng có thể truy cập)
4. Click **Deploy**
5. **Lần đầu deploy**, Google sẽ yêu cầu xác thực:
   - Click **Authorize access**
   - Chọn tài khoản Google của bạn
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow** để cấp quyền
6. Copy **Web App URL** (có dạng: `https://script.google.com/macros/s/SCRIPT_ID/exec`)

### Bước 4: Cấu Hình Biến Môi Trường

1. Thêm biến môi trường `GOOGLE_SHEETS_WEB_APP_URL` vào file `.env.local`:

```env
GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Thay `YOUR_SCRIPT_ID` bằng Script ID từ Web App URL bạn đã copy

3. Nếu deploy lên Vercel, thêm biến môi trường trong **Settings** → **Environment Variables**

### Bước 5: Test Webhook

Để test xem webhook có hoạt động không:

1. Mở terminal
2. Chạy lệnh:

```bash
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '["ORDER_123", "PAID", 500000, "TRANS_456", "Success", "2024-01-01 10:00:00"]'
```

3. Kiểm tra Google Sheet, bạn sẽ thấy dòng mới được thêm vào

## Lưu Ý Quan Trọng

1. **Web App URL Phải Là Public**:
   - Phải chọn **Anyone** trong phần "Who has access"
   - Đảm bảo URL có thể truy cập công khai

2. **Script ID**:
   - Script ID nằm trong Web App URL
   - Có dạng: `https://script.google.com/macros/s/[SCRIPT_ID]/exec`

3. **Xác Thực**:
   - Lần đầu deploy cần xác thực quyền truy cập
   - Chọn **Me** trong "Execute as" để script chạy với quyền của bạn

4. **Security**:
   - Webhook này là public, nên có thể bị spam
   - Nên thêm validation (ví dụ: API key) trong script nếu cần

## Format Dữ Liệu

Webhook nhận dữ liệu dưới dạng array:

```json
[
  "ORDER_123",          // Order ID
  "PAID",               // Status (PAID/FAILED/PENDING)
  500000,               // Amount
  "TRANS_456",          // Transaction ID
  "Success",            // Message
  "01/01/2024 10:00:00" // Updated At (VN timezone)
]
```

## Troubleshooting

### Lỗi: "Script function not found: doPost"
- Đảm bảo function `doPost` được định nghĩa đúng
- Kiểm tra lại code trong Apps Script

### Lỗi: "Authorization required"
- Xác thực lại quyền truy cập
- Chọn **Anyone** trong "Who has access"

### Không thấy dữ liệu trong Sheet
- Kiểm tra xem sheet có đúng không
- Kiểm tra logs trong Apps Script (View → Logs)
- Kiểm tra Web App URL có đúng không

### Lỗi: "Access denied"
- Kiểm tra lại quyền truy cập của Sheet
- Đảm bảo Sheet là public hoặc có quyền truy cập

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong Apps Script
2. Kiểm tra Web App URL có hoạt động không
3. Xem tài liệu Google Apps Script

