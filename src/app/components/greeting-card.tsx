"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "./language-switcher";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";

interface FormData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  message: string;
}

interface GreetingCardProps {
  formData: FormData;
  serviceName?: string | null;
  onBack: () => void;
}

const voucherImages = [
  { alt: "Bronze", src: "/Asset%201@4x.png" },
  { alt: "Silver", src: "/Asset%203@4x.png" },
  { alt: "Gold", src: "/Asset%202@4x.png" },
  { alt: "Platinum", src: "/Asset%205@4x.png" },
  { alt: "Diamond", src: "/Asset%204@4x.png" },
];

export default function GreetingCard({ formData, serviceName }: GreetingCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [paidServiceName, setPaidServiceName] = useState<string | null>(
    serviceName ?? null
  );
  const [ignoreApiService, setIgnoreApiService] = useState(false);

  const BRAND_KEY = "face wash fox";
  const brandRegex = /(Face Wash Fox)/gi;

  const highlightBrandText = (text: string) => {
    if (!text) return null;
    const parts = text.split(brandRegex);
    return parts.map((part, idx) => {
      if (part.toLowerCase() === BRAND_KEY) {
        return (
          <span key={`brand-${idx}`} className="text-[#eb3526] font-semibold">
            {part}
          </span>
        );
      }
      return (
        <span key={`text-${idx}`} className="inline">
          {part}
        </span>
      );
    });
  };

  const containsBrandText = (text: string) =>
    typeof text === "string" && text.toLowerCase().includes(BRAND_KEY);
  useEffect(() => {
    if (serviceName) {
      setPaidServiceName(serviceName);
    }
  }, [serviceName]);
  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Fetch paid service information
  useEffect(() => {
    // First, try to get from sessionStorage (fastest, available immediately)
    const getServiceFromStorage = () => {
      if (typeof window !== "undefined") {
        try {
          // Try multiple keys for better compatibility
          const lastVoucher = sessionStorage.getItem("lastSelectedVoucher");
          const savedServiceName = sessionStorage.getItem("paidServiceName");
          
          if (lastVoucher) {
            const voucher = JSON.parse(lastVoucher);
            const price = typeof voucher.price === "number" ? voucher.price : null;
            if (voucher && voucher.name) {
              console.log("Got service from sessionStorage (lastSelectedVoucher):", voucher.name, "price:", price);
              setPaidServiceName(voucher.name);
              sessionStorage.setItem("paidServiceName", voucher.name);
              setIgnoreApiService(price === 0);
              return { name: voucher.name, isFree: price === 0 };
            }
          }
          
          if (savedServiceName) {
            console.log("Got service from sessionStorage (paidServiceName):", savedServiceName);
            setPaidServiceName(savedServiceName);
            setIgnoreApiService(false);
            return { name: savedServiceName, isFree: false };
          }
        } catch (e) {
          console.error("Error reading voucher from sessionStorage:", e);
        }
      }
      return null;
    };

    // Set from sessionStorage first (immediate)
    const storageService = getServiceFromStorage();

    // Then fetch from API to get the most up-to-date info (may take longer)
    // CHỈ gọi API nếu:
    // 1. Có số điện thoại
    // 2. KHÔNG có service trong sessionStorage HOẶC service trong sessionStorage KHÔNG phải miễn phí
    const fetchPaidService = async () => {
      if (!formData.senderPhone) return;
      
      // Nếu đã có service từ sessionStorage và là voucher miễn phí, KHÔNG gọi API
      if (storageService && storageService.isFree) {
        console.log("⏭️ Skipping API call - free voucher selected from sessionStorage:", storageService.name);
        return;
      }
      
      // Nếu đã có service từ sessionStorage (không phải miễn phí), vẫn giữ nguyên và không override
      if (storageService && !storageService.isFree) {
        console.log("✅ Service from sessionStorage exists, keeping it:", storageService.name);
        // Vẫn có thể gọi API để log, nhưng không override
      }
      
      try {
        const response = await fetch(`/api/get-paid-service?senderPhone=${encodeURIComponent(formData.senderPhone)}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched paid service from API:", data); // Debug log
          
          // CHỈ override nếu:
          // 1. API trả về serviceName
          // 2. KHÔNG có service trong sessionStorage HOẶC service trong sessionStorage không phải miễn phí
          // 3. KHÔNG ignore API (không phải voucher miễn phí đang được chọn)
          if (data.serviceName && !ignoreApiService) {
            // Nếu có storageService (dù miễn phí hay không), giữ nguyên storageService
            // Vì voucher đang được chọn quan trọng hơn đơn hàng đã thanh toán trước đó
            if (storageService) {
              console.log("✅ Keeping service from sessionStorage (selected voucher), ignoring API result:", storageService.name);
              return;
            }
            
            // Chỉ dùng API result nếu không có service trong sessionStorage
            setPaidServiceName(data.serviceName);
            console.log("Updated paidServiceName from API to:", data.serviceName); // Debug log

            if (typeof window !== "undefined") {
              try {
                const lastVoucher = sessionStorage.getItem("lastSelectedVoucher");
                if (lastVoucher) {
                  const voucher = JSON.parse(lastVoucher);
                  // CHỈ update nếu voucher không phải miễn phí
                  if (voucher.price !== 0) {
                    voucher.name = data.serviceName;
                    sessionStorage.setItem("lastSelectedVoucher", JSON.stringify(voucher));
                  }
                }
              } catch (e) {
                console.error("Error updating sessionStorage:", e);
              }
            }
          } else if (data.serviceName && ignoreApiService) {
            console.log("⏭️ Ignoring API result because free voucher is selected");
          }
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch paid service:", response.status, errorText);
          // If API fails but we have storage service, keep using it
          if (!storageService) {
            console.warn("No service found in sessionStorage and API failed");
          }
        }
      } catch (error) {
        console.error("Error fetching paid service:", error);
        // If API fails but we have storage service, keep using it
        if (!storageService && !ignoreApiService) {
          console.warn("No service found in sessionStorage and API error");
        }
      }
    };

    // Fetch from API (this may override sessionStorage value if different)
    // CHỈ gọi nếu không có service trong sessionStorage HOẶC service không phải miễn phí
    if (!storageService || !storageService.isFree) {
      fetchPaidService();
    } else {
      console.log("⏭️ Skipping API call - free voucher selected from sessionStorage");
    }
  }, [formData.senderPhone, ignoreApiService]);

  // Responsive character-per-line settings
  const maxCharsMessage = isMobile ? 37 : 70;
  const maxCharsGreeting = isMobile ? 29 : 70;
  const maxCharsBody = isMobile ? 35 : 70;
  const maxCharsSenderName = isMobile ? 14 : 24;

  // Function to wrap text into lines based on character limit
  const wrapTextIntoLines = (text: string, maxCharsPerLine: number = 50) => {
    if (!text) return [];

    // First split by explicit line breaks
    const explicitLines = text.split("\n");
    const wrappedLines: string[] = [];

    explicitLines.forEach((line) => {
      if (line.length <= maxCharsPerLine) {
        wrappedLines.push(line);
      } else {
        // Wrap long lines
        let currentLine = "";
        const words = line.split(" ");

        words.forEach((word) => {
          if ((currentLine + " " + word).length <= maxCharsPerLine) {
            currentLine += (currentLine ? " " : "") + word;
          } else {
            if (currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              // Word is longer than maxCharsPerLine, split it
              wrappedLines.push(word.substring(0, maxCharsPerLine));
              currentLine = word.substring(maxCharsPerLine);
            }
          }
        });

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      }
    });

    return wrappedLines;
  };

  // Dynamically set highlight phrase based on paid service
  const getHighlightPhrase = () => {
    if (paidServiceName) {
      console.log("getHighlightPhrase - paidServiceName:", paidServiceName); // Debug log
      
      // Normalize service name for comparison (lowercase, remove extra spaces & diacritics)
      const normalizedName = normalizeText(paidServiceName);
      console.log("getHighlightPhrase - normalizedName:", normalizedName); // Debug log
      
      // Check for specific service names (check more specific ones first)
      if (normalizedName.includes("500.000") || normalizedName.includes("500000")) {
        console.log("Matched: Cash Voucher 500.000VNĐ");
        return "voucher Cash Voucher 500.000VNĐ";
      } else if (normalizedName.includes("200.000") || normalizedName.includes("200000")) {
        console.log("Matched: Cash Voucher 200.000VNĐ");
        return "voucher Cash Voucher 200.000VNĐ";
      } else if (
        normalizedName.includes("dịch vụ cộng thêm") ||
        normalizedName.includes("cong them") ||
        normalizedName === "dịch vụ cộng thêm" ||
        normalizedName.includes("service-basic") ||
        normalizedName.startsWith("dịch vụ")
      ) {
        console.log("Matched: Dịch vụ Cộng thêm");
        return "voucher Dịch vụ Cộng thêm trị giá lên đến 299.000VNĐ";
      } else {
        console.log("No match, using original service name:", paidServiceName);
        return `voucher ${paidServiceName}`;
      }
    }
    console.log("No paidServiceName, using default fallback");
    return "voucher Dịch vụ Cộng thêm trị giá lên đến 299.000VNĐ"; // Default fallback
  };

  const highlightPhrase = getHighlightPhrase();

  // Generate dynamic body content based on paid service
  const getDynamicBodyContent = () => {
    const baseText = "Luôn rạng rỡ, yêu bản thân và tận hưởng từng phút giây được nâng niu bởi Nhà Cáo. Gửi tặng bạn ngàn lời yêu thương thông qua ";
    const endText = " để làn da luôn được chăm sóc đúng cách dẫu ngày thường hay ngày lễ!";
    
    if (paidServiceName) {
      // Normalize service name for comparison (lowercase, remove extra spaces & diacritics)
      const normalizedName = normalizeText(paidServiceName);
      console.log("getDynamicBodyContent - normalizedName:", normalizedName);
      
      // Check for specific service names (check more specific ones first)
      if (normalizedName.includes("500.000") || normalizedName.includes("500000")) {
        return baseText + "voucher Cash Voucher 500.000VNĐ" + endText;
      } else if (normalizedName.includes("200.000") || normalizedName.includes("200000")) {
        return baseText + "voucher Cash Voucher 200.000VNĐ" + endText;
      } else if (
        normalizedName.includes("dịch vụ cộng thêm") ||
        normalizedName.includes("cong them") ||
        normalizedName === "dịch vụ cộng thêm" ||
        normalizedName.includes("service-basic") ||
        normalizedName.startsWith("dịch vụ")
      ) {
        console.log("getDynamicBodyContent - Matched Dịch vụ Cộng thêm");
        return baseText + "voucher Dịch vụ Cộng thêm trị giá lên đến 299.000VNĐ" + endText;
      } else {
        console.log("getDynamicBodyContent - No match, using:", paidServiceName);
        return baseText + `voucher ${paidServiceName}` + endText;
      }
    }
    console.log("getDynamicBodyContent - No paidServiceName, using default");
    return t.body; // Default fallback to original translation
  };

  const dynamicBodyContent = getDynamicBodyContent();

  const highlightWords = new Set(
    highlightPhrase.toLowerCase().split(/\s+/).filter(Boolean)
  );
  const normalizeToken = (token: string) =>
    token.toLowerCase().replace(/[.,!?:;"'""()\[\]{}]/g, "");
  const isPriceToken = (token: string) => {
    const compact = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Check for VNĐ, vnd, or price patterns like 299000, 200000, 500000
    return (
      (/\d/.test(compact) && (compact.endsWith("vnd") || compact.includes("vnd"))) ||
      /^(299000|200000|500000|299|200|500)/.test(compact)
    );
  };
  
  // Check if token contains price (like "299.000VNĐ")
  const containsPrice = (token: string) => {
    const normalized = token.toLowerCase();
    return (
      normalized.includes("299.000") ||
      normalized.includes("299000") ||
      normalized.includes("200.000") ||
      normalized.includes("200000") ||
      normalized.includes("500.000") ||
      normalized.includes("500000")
    );
  };
  
  // Function to check if a text segment contains the full voucher phrase
  const containsVoucherPhrase = (text: string) => {
    const normalizedText = normalizeText(text).replace(/[.,!?:;"'""()\[\]{}]/g, "");
    
    if (paidServiceName) {
      // Normalize service name for comparison (lowercase, remove extra spaces & diacritics)
      const normalizedName = normalizeText(paidServiceName);
      
      // Check for specific service names (check more specific ones first)
      if (normalizedName.includes("500.000") || normalizedName.includes("500000")) {
        return (
          normalizedText.includes("cash voucher 500000") ||
          normalizedText.includes("voucher cash voucher 500000") ||
          normalizedText.includes("cash voucher 500.000")
        );
      } else if (normalizedName.includes("200.000") || normalizedName.includes("200000")) {
        return (
          normalizedText.includes("cash voucher 200000") ||
          normalizedText.includes("voucher cash voucher 200000") ||
          normalizedText.includes("cash voucher 200.000")
        );
      } else if (
        normalizedName.includes("dịch vụ cộng thêm") ||
        normalizedName.includes("cong them") ||
        normalizedName === "dịch vụ cộng thêm" ||
        normalizedName.includes("service-basic") ||
        normalizedName.startsWith("dịch vụ")
      ) {
        console.log("containsVoucherPhrase - Matched Dịch vụ Cộng thêm for text:", text);
        return (
          normalizedText.includes("voucher dịch vụ cộng thêm") ||
          normalizedText.includes("dịch vụ cộng thêm") ||
          normalizedText.includes("299000vnd") ||
          normalizedText.includes("299.000vnd") ||
          normalizedText.includes("voucher dịch vụ cộng thêm trị giá lên đến 299000vnd") ||
          normalizedText.includes("voucher dịch vụ cộng thêm trị giá")
        );
      }
    }
    
    // Default fallback
    return (
      normalizedText.includes("voucher dịch vụ cộng thêm") ||
      normalizedText.includes("dịch vụ cộng thêm") ||
      normalizedText.includes("299000vnd") ||
      normalizedText.includes("299.000vnd")
    );
  };

  // Wrap text but keep original indices so we can style substrings across lines
  const wrapTextWithIndices = (
    text: string,
    maxCharsPerLine: number
  ): Array<{ text: string; start: number; end: number }> => {
    if (!text) return [];
    const tokens = Array.from(text.matchAll(/\S+\s*/g)).map((m) => ({
      text: m[0],
      start: m.index ?? 0,
    }));
    const lines: Array<{ text: string; start: number; end: number }> = [];
    let current = "";
    let lineStart = tokens.length ? tokens[0].start : 0;
    tokens.forEach((t, idx) => {
      const nextLen = current.length + t.text.length;
      if (current && nextLen > maxCharsPerLine) {
        lines.push({
          text: current.trimEnd(),
          start: lineStart,
          end: lineStart + current.length,
        });
        current = t.text;
        lineStart = t.start;
      } else {
        current += t.text;
      }
      // last token
      if (idx === tokens.length - 1 && current) {
        lines.push({
          text: current.trimEnd(),
          start: lineStart,
          end: lineStart + current.length,
        });
      }
    });
    return lines;
  };

  // Randomly select a Foxie card

  const getCardNode = () => {
    if (!cardRef.current) {
      throw new Error("Không tìm thấy nội dung thiệp để chụp lại");
    }

    return cardRef.current;
  };

  const exportCardAsPng = async () => {
    const node = getCardNode();

    // Wait for fonts and images
    try {
      const d = document as unknown as { fonts?: { ready?: Promise<void> } };
      await d.fonts?.ready;
    } catch {}

    // Wait for images to load
    const images = node.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(() => resolve(), 1000);
        });
      })
    );

    // Force reflow to ensure all styles are applied
    void node.offsetHeight;

    // Use html-to-image with consistent settings
    const { toPng } = await import("html-to-image");
    const rect = node.getBoundingClientRect();
    const isMobileExport = window.innerWidth < 640;
    const targetWidth = isMobileExport ? Math.round(rect.width) : Math.min(rect.width * 2, 1440);
    const targetHeight = Math.round((rect.height / rect.width) * targetWidth);
    const pixelRatio = isMobileExport ? 1.5 : 2;

    return toPng(node, {
      cacheBust: false,
      backgroundColor: "#ffffff",
      quality: 1,
      pixelRatio,
      width: targetWidth,
      height: targetHeight,
      // Avoid transform scaling to prevent clipping on iOS Safari
      style: {} as Record<string, string>,
      filter: (n) => {
        const el = n as Element;
        if (n.nodeType === Node.TEXT_NODE) return true;
        if (el?.tagName === "SCRIPT" || el?.tagName === "STYLE") return false;
        return true;
      },
      // Keep fonts to maintain design quality
      skipFonts: false,
      skipAutoScale: true,
      includeQueryParams: false,
    });
  };

  const exportCardAsBlob = async () => {
    const dataUrl = await exportCardAsPng();
    const response = await fetch(dataUrl);
    return await response.blob();
  };

  const triggerDownload = async (
    dataUrl: string,
    options?: { skipBackend?: boolean }
  ) => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari =
      /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const fileName = `foxie-card-${Date.now()}.png`;

    const isDataUrl = typeof dataUrl === "string" && dataUrl.startsWith("data:image");
    const shouldUseBackend = !options?.skipBackend && isDataUrl;

    // Strategy 1: Ưu tiên backend download API với dataURL base64 (đảm bảo chất lượng trên mobile)
    if (shouldUseBackend) {
      try {
        console.log("🔄 Sending card to backend API for download...");
        const response = await fetch("/api/download-card", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageData: dataUrl }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          // Try native share API first on mobile (giống QR code)
          if (isMobile && typeof navigator !== "undefined" && navigator.share) {
            try {
              const file = new File([blob], fileName, { type: "image/png" });
              if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: "Foxie Card - Face Wash Fox",
                  text: "Thiệp chúc mừng từ Face Wash Fox",
                });
                URL.revokeObjectURL(url);
                return;
              }
            } catch (shareError) {
              console.warn("Không thể chia sẻ trực tiếp:", shareError);
            }
          }
          
          // Download via link
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setTimeout(() => {
            alert(
              "Ảnh đã được tải xuống! Kiểm tra thư mục Downloads hoặc Gallery của bạn."
            );
          }, 500);
          return;
        } else {
          console.warn("Backend API returned error:", response.status);
        }
      } catch (error) {
        console.log("Backend download failed, trying fallback:", error);
      }
    }

    // Strategy 2: Fallback - Try FileSaver.js approach (client-side)
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Use FileSaver.js for better cross-browser compatibility
      saveAs(blob, fileName);

      // Success feedback
      setTimeout(() => {
        alert(
          "Ảnh đã được tải xuống! Kiểm tra thư mục Downloads hoặc Gallery của bạn."
        );
      }, 500);
      return;
    } catch (error) {
      console.log("FileSaver approach failed:", error);
    }

    // Strategy 2: iOS Safari specific fallback
    if (isIOS && isSafari) {
      try {
        // Convert dataURL to blob for better iOS compatibility
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Open in new tab with save instructions
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Lưu ảnh Foxie Card</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    text-align: center; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #fef3c7, #fed7aa);
                    min-height: 100vh;
                  }
                  img { 
                    max-width: 100%; 
                    height: auto; 
                    border-radius: 12px; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    margin-bottom: 20px;
                  }
                  .instructions { 
                    margin-top: 20px; 
                    padding: 20px; 
                    background: rgba(255,255,255,0.95); 
                    border-radius: 12px; 
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                  }
                  .instructions h3 { 
                    margin: 0 0 15px 0; 
                    color: #dc2626; 
                    font-size: 18px;
                  }
                  .instructions p { 
                    margin: 8px 0; 
                    color: #374151; 
                    line-height: 1.5;
                  }
                  .highlight {
                    background: #fef3c7;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: bold;
                  }
                  .save-button {
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 15px;
                  }
                </style>
              </head>
              <body>
                <img src="${url}" alt="Foxie Card" />
                <div class="instructions">
                  <h3>📱 Cách lưu ảnh trên iPhone/iPad:</h3>
                  <p>1. Nhấn giữ ảnh ở trên</p>
                  <p>2. Chọn <span class="highlight">"Lưu vào Ảnh"</span></p>
                  <p>3. Ảnh sẽ được lưu vào thư viện ảnh của bạn</p>
                  <button class="save-button" onclick="window.close()">Đóng cửa sổ này</button>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
        return;
      } catch (error) {
        console.log("iOS Safari fallback failed:", error);
      }
    }

    // Strategy 3: Generic mobile fallback
    if (isMobile) {
      try {
        // Try direct link download
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          alert(
            "Ảnh đã được tải xuống! Kiểm tra thư mục Downloads hoặc Gallery của bạn."
          );
        }, 500);
        return;
      } catch (error) {
        console.log("Direct download failed:", error);
      }
    }

    // Strategy 4: Final fallback - open image in new tab
    try {
      const newWindow = window.open(dataUrl, "_blank");
      if (!newWindow) {
        // If popup blocked, replace current window
        window.location.href = dataUrl;
      }
    } catch (error) {
      console.error("All download methods failed:", error);
      alert("Không thể tải xuống ảnh. Vui lòng thử lại sau!");
    }
  };

  const handleScreenshot = async () => {
    try {
      const dataUrl = await exportCardAsPng();
      await triggerDownload(dataUrl);
    } catch (error) {
      console.error("Không thể tạo ảnh thiệp:", error);
      alert("Xin lỗi, không thể tạo ảnh thiệp. Vui lòng thử lại sau!");
    }
  };

  const handleShare = async () => {
    try {
      // Export card to dataURL first
      const dataUrl = await exportCardAsPng();
      
      // Try backend API first (giống QR code logic)
      try {
        const response = await fetch("/api/download-card", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageData: dataUrl }),
        });

        if (response.ok) {
          const blob = await response.blob();
          
          // Try native share API
          if (navigator.share) {
            const file = new File([blob], `foxie-card-${Date.now()}.png`, {
              type: "image/png",
            });
            const shareData = {
              title: t.shareTitle,
              text: `${t.shareText} ${formData.senderName} gửi đến ${formData.receiverName}: ${formData.message}`,
              files: [file],
            };

            if (navigator.canShare?.(shareData)) {
              await navigator.share(shareData);
              return;
            }
          }
          
          // Fallback to download if share not available
          const url = URL.createObjectURL(blob);
          await triggerDownload(url, { skipBackend: true });
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          return;
        }
      } catch (apiError) {
        console.warn("Backend API failed, using client-side:", apiError);
      }

      // Fallback to client-side blob
      const blob = await exportCardAsBlob();

      if (blob && navigator.share) {
        const file = new File([blob], `foxie-card-${Date.now()}.png`, {
          type: "image/png",
        });
        const shareData = {
          title: t.shareTitle,
          text: `${t.shareText} ${formData.senderName} gửi đến ${formData.receiverName}: ${formData.message}`,
          files: [file],
        };

        if (navigator.canShare?.(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Final fallback to download (desktop or when navigator.share not available)
      if (blob) {
        const fileName = `foxie-card-${Date.now()}.png`;
        try {
          saveAs(blob, fileName);
          setTimeout(() => {
            alert("Ảnh đã được tải xuống! Kiểm tra thư mục Downloads hoặc Gallery của bạn.");
          }, 500);
        } catch (downloadError) {
          console.warn("FileSaver download failed, falling back to generic download:", downloadError);
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
      } else {
        await triggerDownload(dataUrl);
      }

      const fallbackText = `${t.shareText} ${formData.senderName} gửi đến ${formData.receiverName}: ${formData.message}`;
      try {
        await navigator.clipboard?.writeText(fallbackText);
        alert(t.shareSuccess);
      } catch (clipboardError) {
        console.warn("Không thể sao chép vào clipboard:", clipboardError);
        alert(t.shareError);
      }
    } catch (error) {
      console.error("Không thể chia sẻ thiệp:", error);
      alert(t.shareErrorGeneral);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-4 md:py-8 text-black">
      <LanguageSwitcher />
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => router.push("/voucher")}
            className="flex items-center gap-2 hover:bg-red-50 border border-red-200 bg-transparent px-4 py-2 rounded-md"
          >
            ← Tiếp tục mua sắm
          </button>
        </div>

        {/* Greeting Card + Voucher Decorations */}
        <div className="flex justify-center px-1 sm:px-0">
          <div
            ref={cardRef}
            data-export-root
            className="relative bg-[#feeedd] rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full"
            style={{
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Falling background elements from sides */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Left side falling elements */}
              <div className="absolute -top-20 left-10 w-16 h-16 animate-fall-down-left opacity-30 ">
                <Image
                  src="/20.10/Asset 5@4x.png"
                  alt="falling decoration"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute -top-20 left-12 w-24 h-24 animate-fall-down-left-delayed-1 opacity-25 ">
                <Image
                  src="/20.10/Asset 7@4x.png"
                  alt="falling decoration"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute -top-20 left-12 w-12 h-12 animate-fall-down-left-delayed-2 opacity-20 ">
                <Image
                  src="/20.10/aaa@4x.png"
                  alt="falling decoration"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Right side falling elements */}
              <div className="absolute -top-20 right-10 w-32 h-32 animate-fall-down-right opacity-35 ">
                <Image
                  src="/20.10/Asset 6@4x.png"
                  alt="falling decoration"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute -top-20 right-12 w-24 h-24 animate-fall-down-right-delayed-1 opacity-35 ">
                <Image
                  src="/20.10/Asset 8@4x.png"
                  alt="falling decoration"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute -top-20 right-12 w-14 h-14 animate-fall-down-right-delayed-2 opacity-35 ">
                <Image
                  src="/20.10/bbb@4x.png"
                  alt="falling decoration"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute -top-20 right-12 w-20 h-20 animate-fall-down-right opacity-20">
                <Image
                  src="/20.10/ccc@4x.png"
                  alt="falling decoration"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="absolute -top-20 left-1/2 w-18 h-18 animate-fall-down-left opacity-15 ">
              <Image
                src="/20.10/ccc@4x.png"
                alt="falling decoration"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="absolute -top-20 left-1/2 w-20 h-20 animate-fall-down-right-delayed-1 opacity-20 ">
              <Image
                src="/20.10/Asset 5@4x.png"
                alt="falling decoration"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <header className="w-full">
              <Image
                src="/Header fix@4x.png"
                alt="Foxie Club 20.10 Special - Món quà dành tặng cho bạn"
                width={1920}
                height={600}
                priority
                className="w-full h-auto object-cover"
              />
            </header>
            {/* Decorative Elements */}
            <div className="pointer-events-none absolute inset-0">
              {/* Top right corner decoration */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-orange-300 to-red-400 rounded-full opacity-60"></div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-70"></div>
              <div className="absolute top-12 right-2 w-6 h-6 bg-orange-200 rounded-full opacity-50"></div>

              {/* Scattered decorative shapes */}
              <div className="absolute top-20 right-12 w-4 h-4 bg-red-300 rounded-full opacity-60"></div>
              <div className="absolute top-24 right-6 w-3 h-3 bg-yellow-400 rounded-full opacity-70"></div>
              <div className="absolute top-16 right-20 w-5 h-5 bg-orange-300 rounded-full opacity-50"></div>

              {/* Bottom decorations */}
              <div className="absolute bottom-20 left-4 w-12 h-12 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full opacity-60"></div>
              <div className="absolute bottom-16 left-8 w-6 h-6 bg-red-200 rounded-full opacity-70"></div>
              <div className="absolute bottom-12 left-12 w-4 h-4 bg-orange-200 rounded-full opacity-50"></div>

              {/* Summer Fox decorative images with subtle animations */}
              <>
                <div
                  className={`absolute ${
                    isMobile
                      ? "top-33 left-2 w-16 opacity-70"
                      : "top-40 left-8 w-24 sm:w-28 md:w-32 opacity-80"
                  } animate-float-y z-100`}
                >
                  <Image
                    src="/Cáo mùa hè/Asset 1@4x.png"
                    alt="decorative fox"
                    width={256}
                    height={256}
                    className="w-full h-auto drop-shadow-md rotate-[-8deg]"
                    aria-hidden
                  />
                </div>
                <div
                  className={`absolute ${
                    isMobile
                      ? "bottom-35 left-2 w-16 opacity-70"
                      : "bottom-50 left-2 w-20 sm:w-24 md:w-28 opacity-80"
                  } animate-float-x z-100`}
                >
                  <Image
                    src="/Cáo mùa hè/Asset 6@4x.png"
                    alt="decorative fox"
                    width={256}
                    height={256}
                    className="w-full h-auto drop-shadow-md"
                    aria-hidden
                  />
                </div>
                <div
                  className={`absolute ${
                    isMobile
                      ? "bottom-22 right-6 w-16 opacity-80"
                      : "bottom-38 right-8 w-20 sm:w-20 md:w20 opacity-100"
                  } animate-swing-60 z-100`}
                >
                  <Image
                    src="/Cáo mùa hè/Asset 8@4x.png"
                    alt="decorative sun"
                    width={256}
                    height={256}
                    className="w-full h-auto drop-shadow-md"
                    aria-hidden
                  />
                </div>
              </>
            </div>
            {/* Letter Header */}
            <div className="relative z-10 p-4 md:p-2 flex justify-center">
              {/* Greeting Card Info */}
              <div className="text-center mb-2"></div>
            </div>

            {/* Letter Content with Lines */}
            <div className="flex relative z-10 px-4 md:px-8 pb-5 md:pb-6 justify-center items-center">
              <div
                className={`absolute animate-zoom-in-out transform ${
                  isMobile
                    ? "w-32 opacity-30 z-100"
                    : "w-32 sm:w-32 md:w-48 opacity-30 z-100"
                }`}
              >
                <Image
                  src="/Asset 17@4x.png"
                  alt="decorative fox"
                  width={256}
                  height={256}
                  className="w-full h-auto transform drop-shadow-md rotate-[-8deg] "
                  aria-hidden
                />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-md md:rounded-lg p-4 md:p-6 border border-orange-200 shadow-sm">
                {/* Letter Lines */}
                <div className="space-y-2 md:space-y-4">
                  {/* Date line */}
                  <div className="flex justify-end">
                    <div className="w-24 h-6 md:w-28 md:h-7 border-b border-gray-300 flex items-center justify-end">
                      <span
                        className="text-[20px] md:text[20px] text-gray-600 "
                        style={{
                          fontFamily: "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
                          fontWeight: "600",
                        }}
                      >
                        {new Date().toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Greeting line */}
                  <div className="flex items-center">
                    <span
                      className={`w-auto inline-flex ${
                        isMobile ? "text-[20px] pl-3" : "text-[24px] pl-4"
                      } text-gray-800 leading-relaxed border-b border-gray-300 pb-0.5 gap-1`}
                      style={{
                        fontFamily: "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
                        fontWeight: "800",
                      }}
                    >
                      {t.dear}{" "}
                      <span className=" text-orange-500 ">
                        {formData.receiverName}
                      </span>
                    </span>
                  </div>

                  {/* Content lines with actual message */}
                  <div className="space-y-2 md:space-y-3">
                    {/* User's personal message - Auto-wrap with dynamic lines */}
                    {formData.message && formData.message.trim() !== "" && (
                      <div className="space-y-1">
                        {wrapTextIntoLines(
                          formData.message,
                          maxCharsMessage
                        ).map((line, lineIndex) => (
                          <div
                            key={lineIndex}
                            className={`${
                              isMobile ? "h-6" : "h-7"
                            } border-b border-gray-300 flex items-center`}
                          >
                            <span
                              className={`${
                                isMobile
                                  ? "text-[20px] pl-3 "
                                  : "text-[24px] pl-4"
                              } text-gray-800 leading-relaxed w-full`}
                              style={{
                                fontFamily: "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
                                fontWeight: "400",
                                textIndent:
                                  lineIndex === 0 ? "1rem" : undefined,
                              }}
                            >
                              {highlightBrandText(line)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fixed content from Face Wash Fox - Always at the end */}
                    <div className="h-6 md:h-7 justify-center flex items-center">
                      <span className="flex justify-center items-center text-sm text-gray-800  leading-relaxed gap-5">
                        <Image
                          src="/Sticker 1@4x.png"
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                        />
                        <Image
                          src="/Sticker 4@4x.png"
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                        />
                        <Image
                          src="/Sticker 5@4x.png"
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-10 h-auto object-cover"
                        />
                        <Image
                          src="/Sticker 6@4x.png"
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                        />
                        <Image
                          src="/Sticker 7@4x.png"
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                        />
                      </span>
                    </div>

                    {/* Fixed content with auto-wrapping */}
                    {wrapTextIntoLines(
                      `${t.faceWashGreeting} ${formData.receiverName},`,
                      maxCharsGreeting
                    ).map((line, lineIndex) => (
                      <div
                        key={`greeting-${lineIndex}`}
                        className={`${
                          isMobile ? "h-6 text-[10px]" : "h-7"
                        } border-b border-gray-300 text-[15px] flex items-center justify-center`}
                      >
                        <span
                          className={`${
                            isMobile ? "text-[20px] pl-3" : "text-[24px] pl-4"
                          } text-gray-800 leading-relaxed w-full`}
                          style={{
                            fontFamily: "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
                            fontWeight: "400",
                            textIndent: lineIndex === 0 ? "1rem" : undefined,
                          }}
                        >
                          {highlightBrandText(line)}
                        </span>
                      </div>
                    ))}
                    {wrapTextWithIndices(dynamicBodyContent, maxCharsBody).map(
                      (seg, lineIndex) => {
                        const tokens = seg.text.split(/(\s+)/); // keep spaces
                        return (
                          <div
                            key={`content1-${lineIndex}`}
                            className={`${
                              isMobile ? "h-6" : "h-7"
                            } border-b border-gray-300 flex items-center`}
                          >
                            <span
                              className={`${
                                isMobile
                                  ? "text-[20px] pl-3"
                                  : "text-[24px] pl-4"
                              } text-gray-800 leading-relaxed w-full`}
                              style={{
                                fontFamily: "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
                                fontWeight: "400",
                                textIndent:
                                  lineIndex === 0 ? "1rem" : undefined,
                              }}
                            >
                              {/* Check if this line contains the voucher phrase */}
                              {containsVoucherPhrase(seg.text) ? (
                                <span className="text-[#eb3526] font-bold">
                                  {seg.text}
                                </span>
                              ) : containsBrandText(seg.text) ? (
                                <>{highlightBrandText(seg.text)}</>
                              ) : (
                                tokens.map((tk, i) => {
                                  if (/^\s+$/.test(tk))
                                    return <span key={i}>{tk}</span>;
                                  const norm = normalizeToken(tk);
                                  if (
                                    highlightWords.has(norm) ||
                                    isPriceToken(tk) ||
                                    containsPrice(tk)
                                  ) {
                                    return (
                                      <strong key={i} className="text-[#eb3526]">
                                        {tk}
                                      </strong>
                                    );
                                  }
                                  return <span key={i}>{tk}</span>;
                                })
                              )}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* Signature lines */}
                  <div className="flex justify-end text-center items-center gap-6 md:gap-8 mt-6 md:mt-8">
                    <div className="text-center w-40  items-center justify-center">
                      <div className="relative w-full h-6 md:h-8 border-b border-gray-300 mb-1 md:mb-2 flex items-center justify-center">
                        <span className="text-sm text-gray-800 font-medium">
                          <Image
                            src="/nguoiGui.png"
                            alt="Thanks"
                            width={50}
                            height={50}
                            className="w-8 sm:w-12 h-auto ml-4 md:ml-5 mb-8 md:mb-9 opacity-15"
                          />
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center px-2">
                          <span
                            className="text-base md:text-[24px] text-orange-500 text-center leading-relaxed whitespace-pre-wrap break-words"
                            style={{
                              fontFamily: "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
                              fontWeight: "600",
                            }}
                          >
                            {wrapTextIntoLines(
                              formData.senderName,
                              maxCharsSenderName
                            ).join("\n")}
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-[20px] md:text-[20px] text-gray-800 text-center items-center justify-center leading-relaxed pl-3 md:pl-4 w-40 "
                        style={{
                          fontFamily: "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
                          fontWeight: "400",
                        }}
                      >
                        {t.signatureText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Letter Footer */}
            <footer className="w-full mt-8 relative">
              <Image
                src="/Footer@4x.png"
                alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                width={1920}
                height={400}
                className="w-full h-auto object-cover"
              />
              <Image
                src="/QR_Dieu_Khoan_20_10.png"
                alt="QR Code - Điều khoản sử dụng"
                width={120}
                height={120}
                priority
                className="absolute bottom-3 right-3 w-16 h-16 sm:bottom-4 sm:right-4 sm:w-24 sm:h-24 object-cover z-10"
              />
            </footer>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8">
          <button
            onClick={handleScreenshot}
            className="hidden sm:flex items-center justify-center gap-2 bg-gradient-to-r from-orange-300 to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-full shadow-lg w-full sm:w-auto"
          >
            📱 {t.saveCardButton}
          </button>
          <button
            onClick={handleShare}
            className="flex sm:hidden items-center justify-center gap-2 bg-gradient-to-r from-yellow-200 to-yellow-500 hover:from-yellow-400 hover:to-green-700 text-white px-6 py-3 rounded-full shadow-lg w-full sm:w-auto"
          >
            {isMobile ? t.shareAndSaveButton : ""}
          </button>
        </div>

        {/* Terms Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => window.open("/terms", "_blank")}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            {t.rule}
          </button>
        </div>

        {/* Voucher auto-scrolling strip */}
        <div className="mt-8">
          <div className="relative mx-auto max-w-4xl rounded-xl bg-white/80 border border-orange-200 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-200/40 via-yellow-200/40 to-teal-200/40 blur-xl" />
            <div className="relative py-3 sm:py-4 overflow-hidden">
              <div
                className="flex gap-4 items-center will-change-transform min-w-max"
                style={{ animation: "marquee 22s linear infinite" }}
              >
                {[...voucherImages, ...voucherImages].map((voucher, index) => (
                  <Image
                    key={`${voucher.alt}-${index}`}
                    src={voucher.src}
                    alt={voucher.alt}
                    width={220}
                    height={120}
                    className="h-20 md:h-24 w-auto flex-none"
                    aria-hidden={index >= voucherImages.length}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          @keyframes floatY {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
            }
          }
          @keyframes floatX {
            0%,
            100% {
              transform: translateX(0);
            }
            50% {
              transform: translateX(6px);
            }
          }
          @keyframes bob {
            0% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-6px) rotate(2deg);
            }
            100% {
              transform: translateY(0) rotate(0deg);
            }
          }
          @keyframes rotateSlow {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }

          .animate-float-y {
            animation: floatY 5s ease-in-out infinite;
          }
          .animate-float-x {
            animation: floatX 6s ease-in-out infinite;
          }
          .animate-bob {
            animation: bob 4.5s ease-in-out infinite;
          }
          .animate-rotate-slow {
            animation: rotateSlow 24s linear infinite;
          }
          .animate-zoom-in-out {
            animation: zoomInOut 3.5s ease-in-out infinite;
          }

          @keyframes swing60 {
            0% {
              transform: rotate(-30deg);
            }
            50% {
              transform: rotate(30deg);
            }
            100% {
              transform: rotate(-30deg);
            }
          }
          .animate-swing-60 {
            animation: swing60 2.5s ease-in-out infinite;
            transform-origin: 50% 10%;
          }

          @keyframes zoomInOut {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
          .animate-zoom-in-out {
            animation: zoomInOut 3s ease-in-out infinite;
          }
        `}</style>

        
      </div>
    </div>
  );
}
