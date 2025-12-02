interface EmailTemplateData {
  senderName: string;
  receiverName: string;
  message?: string;
  serviceName?: string;
  orderId?: string;
  amount?: number;
}

export function createPaymentSuccessEmail(data: EmailTemplateData): {
  subject: string;
  html: string;
} {
  const { senderName, receiverName, serviceName, orderId, amount } = data;

  const isFree = amount === 0 || amount === undefined;
  const subject = isFree 
    ? `🎁 Voucher miễn phí đã được kích hoạt - Face Wash Fox`
    : `🎉 Thanh toán thành công - Face Wash Fox`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fef5f0;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #feeedd;
    }
    .header h1 {
      color: #dc2626;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin: 20px 0;
    }
    .info-box {
      background-color: #feeedd;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 5px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(to right, #dc2626, #f97316);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Cảm ơn bạn đã thanh toán!</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${senderName}</strong>,</p>
      ${isFree 
        ? `<p>Cảm ơn bạn đã sử dụng voucher miễn phí của Face Wash Fox!</p>`
        : `<p>Cảm ơn bạn đã thanh toán thành công cho dịch vụ của Face Wash Fox!</p>`
      }
      
      <div class="info-box">
        <p><strong>Thông tin ${isFree ? 'voucher' : 'đơn hàng'}:</strong></p>
        ${orderId ? `<p>Mã ${isFree ? 'voucher' : 'đơn hàng'}: <strong>${orderId}</strong></p>` : ""}
        ${serviceName ? `<p>Dịch vụ: <strong>${serviceName}</strong></p>` : ""}
        ${!isFree && amount ? `<p>Số tiền: <strong>${amount.toLocaleString("vi-VN")} VNĐ</strong></p>` : ""}
        ${isFree ? `<p style="color: #dc2626; font-weight: bold;">💰 Voucher miễn phí - Không cần thanh toán</p>` : ""}
        <p>Người nhận: <strong>${receiverName}</strong></p>
      </div>

      <p>${isFree ? 'Voucher của bạn đã được kích hoạt thành công. Bạn có thể xem và gửi thiệp chúc mừng ngay bây giờ!' : 'Đơn hàng của bạn đã được xác nhận và đang được xử lý. Bạn có thể xem và gửi thiệp chúc mừng ngay bây giờ!'}</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://facewashfox.com"}/?showGreetingCard=1&orderId=${orderId || ""}" class="button">
          Xem thiệp chúc mừng
        </a>
      </div>

      <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
    </div>
    <div class="footer">
      <p>Trân trọng,<br><strong>Face Wash Fox Team</strong></p>
      <p style="font-size: 12px; margin-top: 20px;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export function createGreetingCardSentEmail(data: EmailTemplateData): {
  subject: string;
  html: string;
} {
  const { senderName, receiverName, message } = data;

  const subject = `💌 Thiệp chúc mừng đã được gửi thành công - Face Wash Fox`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fef5f0;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #feeedd;
    }
    .header h1 {
      color: #dc2626;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin: 20px 0;
    }
    .message-box {
      background-color: #feeedd;
      border-left: 4px solid #dc2626;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      font-style: italic;
      text-align: center;
    }
    .info-box {
      background-color: #f9fafb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💌 Thiệp đã được gửi thành công!</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${senderName}</strong>,</p>
      <p>Thiệp chúc mừng của bạn đã được gửi thành công đến <strong>${receiverName}</strong>!</p>
      
      ${message ? `
      <div class="message-box">
        <p>"${message}"</p>
      </div>
      ` : ""}

      <div class="info-box">
        <p><strong>Thông tin thiệp:</strong></p>
        <p>Người gửi: <strong>${senderName}</strong></p>
        <p>Người nhận: <strong>${receiverName}</strong></p>
      </div>

      <p>Thiệp chúc mừng đã được tạo và lưu trữ. Bạn có thể tải xuống hoặc chia sẻ thiệp bất cứ lúc nào.</p>
      
      <p>Cảm ơn bạn đã sử dụng dịch vụ của Face Wash Fox. Chúc bạn và người thân có những khoảnh khắc tuyệt vời!</p>
    </div>
    <div class="footer">
      <p>Trân trọng,<br><strong>Face Wash Fox Team</strong></p>
      <p style="font-size: 12px; margin-top: 20px;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export function createGreetingCardReceiverEmail(data: EmailTemplateData): {
  subject: string;
  html: string;
} {
  const { senderName, receiverName, message, serviceName, orderId } = data;

  const subject = `💌 Bạn có một thiệp chúc mừng từ ${senderName} - Face Wash Fox`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fef5f0;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #feeedd;
    }
    .header h1 {
      color: #dc2626;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin: 20px 0;
    }
    .message-box {
      background-color: #feeedd;
      border-left: 4px solid #dc2626;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      font-style: italic;
      text-align: center;
      font-size: 16px;
      line-height: 1.8;
    }
    .info-box {
      background-color: #f9fafb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 8px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(to right, #dc2626, #f97316);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      margin: 20px 0;
      text-align: center;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .highlight {
      color: #dc2626;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💌 Bạn có một thiệp chúc mừng!</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${receiverName}</strong>,</p>
      <p><strong class="highlight">${senderName}</strong> đã gửi tặng bạn một thiệp chúc mừng đặc biệt từ Face Wash Fox!</p>
      
      ${message ? `
      <div class="message-box">
        <p>"${message}"</p>
        <p style="margin-top: 15px; font-size: 14px; font-style: normal;">— ${senderName}</p>
      </div>
      ` : ""}

      ${serviceName ? `
      <div class="info-box">
        <p><strong>Món quà đặc biệt:</strong></p>
        <p style="color: #dc2626; font-weight: bold;">${serviceName}</p>
      </div>
      ` : ""}

      <p>Thiệp chúc mừng này được tạo riêng cho bạn với tất cả tình cảm và lời chúc tốt đẹp nhất. Hãy xem thiệp để nhận được những lời chúc ý nghĩa từ người thân yêu của bạn!</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://facewashfox.com"}/?showGreetingCard=1&orderId=${data.orderId || ""}" class="button">
          Xem thiệp chúc mừng
        </a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        Chúc bạn luôn rạng rỡ, yêu bản thân và tận hưởng từng phút giây được nâng niu bởi Nhà Cáo! 🦊
      </p>
    </div>
    <div class="footer">
      <p>Trân trọng,<br><strong>Face Wash Fox Team</strong></p>
      <p style="font-size: 12px; margin-top: 20px;">
        Email này được gửi tự động, vui lòng không trả lời.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}


