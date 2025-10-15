import type { Metadata } from "next";
export const dynamic = "force-dynamic"; // luôn render theo payload, tránh cache
export const runtime = "nodejs";       // cần Node (không phải Edge)
export const revalidate = 0;            // tắt ISR hoàn toàn

export const metadata: Metadata = {
  title: "Card Export",
};

function sanitize(text?: string) {
  return (text ?? "").toString();
}

type ExportSearchParams = {
  payload?: string;
};

export default function ExportCardPage({ searchParams }: { searchParams: ExportSearchParams }) {
  // Nhận payload qua query (base64 JSON) để puppeteer mở URL là đủ
  const payload = searchParams?.payload ? JSON.parse(Buffer.from(searchParams.payload, "base64").toString("utf8")) : {};

  // Kích thước xuất (mặc định 1440x2560 cho story)
  const width  = Number(payload?.width  ?? 1440);
  const height = Number(payload?.height ?? 2560);

  const {
    senderName = "",
    receiverName = "",
    message = "",
    lang = "vi",
    // tuyệt đối hoá URL ảnh từ client (xem bước 3)
    headerUrl = "",
    footerUrl = "",
    stickers = [],
  } = payload;

  // Responsive rules similar to greeting-card.tsx
  const isMobile = width < 640;
  const maxCharsMessage = isMobile ? 37 : 70;
  const maxCharsBody = isMobile ? 35 : 70;
  const maxCharsSenderName = isMobile ? 14 : 24;

  const wrapTextIntoLines = (text?: string, maxCharsPerLine: number = 50) => {
    const value = (text || "").toString();
    if (!value) return [] as string[];
    const explicitLines = value.split("\n");
    const wrappedLines: string[] = [];
    explicitLines.forEach((line) => {
      if (line.length <= maxCharsPerLine) {
        wrappedLines.push(line);
      } else {
        let currentLine = "";
        const words = line.split(" ");
        words.forEach((word) => {
          if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
            currentLine += (currentLine ? " " : "") + word;
          } else {
            if (currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              wrappedLines.push(word.substring(0, maxCharsPerLine));
              currentLine = word.substring(maxCharsPerLine);
            }
          }
        });
        if (currentLine) wrappedLines.push(currentLine);
      }
    });
    return wrappedLines;
  };

  // Font: nhúng thẳng để puppeteer luôn có
  // Bạn thay bằng font của bạn (link Google Fonts hoặc @font-face file tĩnh)
  return (
    <html lang={lang}>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bonheur+Royale&family=Inter:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root { --w:${width}px; --h:${height}px; }
          *{ box-sizing:border-box; -webkit-font-smoothing: antialiased; }
          html,body{ margin:0; padding:0; }
          
          /* Khung cố định kích thước để chụp */
          .canvas {
            width: var(--w);
            height: var(--h);
            background: #feeedd;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            overflow: hidden;
            border-radius: 48px;
            position: relative;
          }

          /* KHÔNG animation, KHÔNG transition */
          .no-anim, .no-anim * {
            animation: none !important; 
            transition: none !important; 
            filter: none !important; 
            text-shadow: none !important;
          }

          .header img, .footer img { 
            width: 100%; 
            display: block; 
            height: auto;
          }
          
          /* Decorative elements */
          .decorative-element {
            position: absolute;
            pointer-events: none;
            z-index: 1;
          }
          
          .decorative-element img {
            width: 100%;
            height: auto;
            object-fit: contain;
          }
          
          /* Letter content area */
          .letter-content {
            position: relative;
            z-index: 10;
            padding: 16px 32px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex: 1;
          }
          
          .letter-paper {
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(2px);
            border-radius: 8px;
            padding: 16px 24px;
            border: 1px solid #fed7aa;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            max-width: 80%;
            width: 100%;
            position: relative;
          }
          
          /* Decorative fox in center */
          .center-fox {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 96px;
            height: 96px;
            opacity: 0.3;
            z-index: 0;
            pointer-events: none;
          }
          
          .letter-line {
            border-bottom: 1px solid #d1d5db;
            padding: 8px 0;
            display: flex;
            align-items: center;
          }
          
          .date-line {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
          }
          
          .date-text {
            font-family: "Bonheur Royale", cursive;
            font-weight: 600;
            font-size: 20px;
            color: #6b7280;
          }
          
          .greeting-line {
            font-family: "Bonheur Royale", cursive;
            font-weight: 800;
            font-size: 24px;
            color: #1f2937;
            padding-left: 16px;
          }
          
          .greeting-name {
            color: #f97316;
          }
          
          .message-line {
            font-family: "Bonheur Royale", cursive;
            font-weight: 400;
            font-size: 24px;
            color: #1f2937;
            padding-left: 16px;
            line-height: 1.25;
            white-space: pre-wrap;
          }
          
          .sticker-row {
            display: flex;
            gap: 16px;
            justify-content: center;
            align-items: center;
            margin: 12px 0 6px;
          }
          
          .sticker-row img {
            height: 16px;
            width: auto;
            object-fit: contain;
          }
          
          .signature-section {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 24px;
            margin-top: 24px;
          }
          
          .signature-content {
            text-align: center;
            width: 160px;
          }
          
          .signature-line {
            border-bottom: 1px solid #d1d5db;
            margin-bottom: 4px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          
          .signature-name {
            font-family: "Bonheur Royale", cursive;
            font-weight: 600;
            font-size: 24px;
            color: #f97316;
            text-align: center;
            line-height: 1.25;
            white-space: pre-wrap;
          }
          
          .signature-text {
            font-family: "Bonheur Royale", cursive;
            font-weight: 400;
            font-size: 20px;
            color: #1f2937;
            text-align: center;
            padding-left: 12px;
            width: 160px;
          }
          
          .signature-icon {
            position: absolute;
            width: 32px;
            height: auto;
            opacity: 0.15;
            margin-left: 16px;
            margin-bottom: 36px;
          }
        `}</style>
      </head>
      <body>
        <div className="canvas no-anim">
          {/* Header */}
          <div className="header">{headerUrl && <img src={headerUrl} alt="header" />}</div>

          {/* Decorative Elements */}
          <div style={{position: 'absolute', inset: '0', pointerEvents: 'none'}}>
            {/* Top right corner decoration */}
            <div style={{position: 'absolute', top: '16px', right: '16px', width: '64px', height: '64px', background: 'linear-gradient(135deg, #fdba74, #f87171)', borderRadius: '50%', opacity: '0.6'}}></div>
            <div style={{position: 'absolute', top: '32px', right: '32px', width: '32px', height: '32px', background: '#fde047', borderRadius: '50%', opacity: '0.7'}}></div>
            <div style={{position: 'absolute', top: '48px', right: '8px', width: '24px', height: '24px', background: '#fed7aa', borderRadius: '50%', opacity: '0.5'}}></div>

            {/* Scattered decorative shapes */}
            <div style={{position: 'absolute', top: '80px', right: '48px', width: '16px', height: '16px', background: '#fca5a5', borderRadius: '50%', opacity: '0.6'}}></div>
            <div style={{position: 'absolute', top: '96px', right: '24px', width: '12px', height: '12px', background: '#facc15', borderRadius: '50%', opacity: '0.7'}}></div>
            <div style={{position: 'absolute', top: '64px', right: '80px', width: '20px', height: '20px', background: '#fdba74', borderRadius: '50%', opacity: '0.5'}}></div>

            {/* Bottom decorations */}
            <div style={{position: 'absolute', bottom: '80px', left: '16px', width: '48px', height: '48px', background: 'linear-gradient(135deg, #fef3c7, #fdba74)', borderRadius: '50%', opacity: '0.6'}}></div>
            <div style={{position: 'absolute', bottom: '64px', left: '32px', width: '24px', height: '24px', background: '#fecaca', borderRadius: '50%', opacity: '0.7'}}></div>
            <div style={{position: 'absolute', bottom: '48px', left: '48px', width: '16px', height: '16px', background: '#fed7aa', borderRadius: '50%', opacity: '0.5'}}></div>

            {/* Summer Fox decorative images */}
            <div style={{position: 'absolute', top: '160px', left: '32px', width: '96px', height: '96px', opacity: '0.8'}}>
              <img src="/C%C3%A1o%20m%C3%B9a%20h%C3%A8/Asset%201@4x.png" alt="decorative fox" style={{width: '100%', height: 'auto', transform: 'rotate(-8deg)'}} />
            </div>
            
            <div style={{position: 'absolute', bottom: '200px', left: '8px', width: '80px', height: '80px', opacity: '0.8'}}>
              <img src="/C%C3%A1o%20m%C3%B9a%20h%C3%A8/Asset%206@4x.png" alt="decorative fox" style={{width: '100%', height: 'auto'}} />
            </div>
            
            <div style={{position: 'absolute', bottom: '140px', right: '32px', width: '80px', height: '80px', opacity: '1'}}>
              <img src="/C%C3%A1o%20m%C3%B9a%20h%C3%A8/Asset%208@4x.png" alt="decorative sun" style={{width: '100%', height: 'auto'}} />
            </div>
            
            <div style={{position: 'absolute', top: '200px', left: '50%', transform: 'translateX(-50%)', width: '96px', height: '96px', opacity: '0.3'}}>
              <img src="/C%C3%A1o%20m%C3%B9a%20h%C3%A8/Asset%202@4x.png" alt="decorative fox" style={{width: '100%', height: 'auto', transform: 'rotate(-8deg)'}} />
            </div>
          </div>

          {/* Letter Content */}
          <div className="letter-content">
            <div className="letter-paper">
              {/* Decorative fox in center */}
              <div className="center-fox">
                <img src="/C%C3%A1o%20m%C3%B9a%20h%C3%A8/Asset%202@4x.png" alt="decorative fox" style={{width: '100%', height: 'auto', transform: 'rotate(-8deg)'}} />
              </div>
              
              {/* Date line */}
              <div className="date-line">
                <div className="date-text">
                  {new Date().toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})}
                </div>
              </div>

              {/* Greeting line - responsive */}
              <div className="letter-line">
                <div className="greeting-line">
                  Dear, <span className="greeting-name">{sanitize(receiverName)}</span>
                </div>
              </div>

              {/* User's personal message - responsive wrapping */}
              {message && message.trim() !== "" && (
                <div>
                  {wrapTextIntoLines(sanitize(message), maxCharsMessage).map((line, lineIndex) => (
                    <div key={lineIndex} className="letter-line">
                      <div className="message-line" style={{ textIndent: lineIndex === 0 ? ("1rem" as React.CSSProperties["textIndent"]) : undefined }}>{line}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stickers row - lấy từ payload để đồng bộ với greeting-card */}
              <div className="sticker-row">
                {(stickers as string[]).slice(0,5).map((s, i) => (
                  <img key={i} src={s} alt="sticker" />
                ))}
              </div>

              {/* Fixed content lines - Face Wash Fox message with wrapping */}
              {wrapTextIntoLines(
                "Nhân ngày 20/10, Face Wash Fox chúc hehe,\nLuôn rạng rỡ, yêu bản thân và tận hưởng từng phút giây được nâng niu\nbởi Nhà Cáo. Gửi tặng bạn ngàn lời yêu thương thông qua voucher Dịch\nvụ Cộng thêm trị giá lên đến 299.000VND để làn da luôn được chăm sóc\nđúng cách dẫu ngày thường hay ngày lễ!",
                maxCharsBody
              ).map((line, idx) => (
                <div key={idx} className="letter-line">
                  <div className="message-line" style={{ textIndent: idx === 0 ? ("1rem" as React.CSSProperties["textIndent"]) : undefined }}>{line}</div>
                </div>
              ))}

              {/* Signature section - responsive sender name wrapping */}
              <div className="signature-section">
                <div className="signature-content">
                  <div className="signature-line">
                    <img src="/nguoiGui.png" alt="signature icon" className="signature-icon" />
                    <div className="signature-name" style={{ whiteSpace: "pre-wrap" }}>
                      {wrapTextIntoLines(sanitize(senderName), maxCharsSenderName).join("\n")}
                    </div>
                  </div>
                  <div className="signature-text">Thân mến gửi trao ❤️</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">{footerUrl && <img src={footerUrl} alt="footer" />}</div>
        </div>
      </body>
    </html>
  );
}

