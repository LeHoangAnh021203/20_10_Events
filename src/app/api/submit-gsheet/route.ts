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

    // Tạo payload dưới dạng array để đảm bảo đúng thứ tự và không bị ghi đè
    const now = new Date()
    const vnDate = now.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    const vnTime = now.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })
    const vnDateTime = `${vnDate} ${vnTime}`

    const payload = [
      body.senderName,                    // Cột A: Tên người gửi
      `'${body.senderPhone}`,           // Cột B: SĐT người gửi  
      body.senderEmail || '',           // Cột C: Email người gửi
      body.receiverName,                // Cột D: Tên người nhận
      `'${body.receiverPhone}`,         // Cột E: SĐT người nhận
      body.receiverEmail || '',         // Cột F: Email người nhận
      body.message,                     // Cột G: Lời chúc
      vnDateTime                        // Cột H: Thời gian (VN) dd/MM/yyyy HH:mm:ss
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
