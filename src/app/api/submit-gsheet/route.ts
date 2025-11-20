import { NextResponse } from "next/server"

export const runtime = "nodejs"

const REQUIRED_FIELDS = [
  "senderName",
  "senderPhone",
  "receiverName",
  "receiverPhone",
  "message",
]

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const missingField = REQUIRED_FIELDS.find((field) => !body?.[field])
    if (missingField) {
      return NextResponse.json(
        { error: `Thiếu trường dữ liệu: ${missingField}` },
        { status: 400 }
      )
    }

    const webhookUrl = process.env.GOOGLE_SHEETS_WEB_APP_URL
    if (!webhookUrl) {
      console.error("GOOGLE_SHEETS_WEB_APP_URL chưa được cấu hình")
      return NextResponse.json(
        { error: "Máy chủ chưa cấu hình kết nối Google Sheets" },
        { status: 500 }
      )
    }

    // Tạo payload phù hợp với Apps Script mới (sheet "momo")
    const now = new Date()
    const vnDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    const vnTime = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })

    // Gộp thông tin người nhận + gói dịch vụ + lời chúc vào ghi chú
    const notes = [
      body.receiverName ? `Người nhận: ${body.receiverName}` : null,
      body.receiverPhone ? `SĐT người nhận: ${body.receiverPhone}` : null,
      body.receiverEmail ? `Email người nhận: ${body.receiverEmail}` : null,
      body.giftService ? `Gói dịch vụ: ${body.giftService}` : null,
      body.message ? `Lời chúc: ${body.message}` : null,
    ]
      .filter(Boolean)
      .join(" | ")

    const payload = [
      body.senderName,                        // Tên khách hàng
      `'${body.senderPhone}`,                 // SĐT
      body.senderEmail || "",                 // Email
      notes || "",                            // Ghi chú
      vnDate,                                 // Ngày
      vnTime,                                 // Giờ
      "momo",                                 // Tab đích trong Google Sheet
    ]

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const responseText = await response.text()
      console.error("Google Apps Script trả về lỗi", response.status, responseText)
      throw new Error(`Webhook trả về lỗi ${response.status}: ${responseText}`)
    }

    const responseJson = await response.json().catch(() => null)
    console.info("Google Apps Script phản hồi", response.status, responseJson)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/submit-gsheet thất bại:", error)
    return NextResponse.json(
      { error: "Không thể gửi dữ liệu tới Google Sheets" },
      { status: 500 }
    )
  }
}
