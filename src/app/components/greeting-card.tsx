"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
// import LanguageSwitcher from "./language-switcher";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import {
  createGreetingCardSentEmail,
  createGreetingCardReceiverEmail,
} from "@/lib/email-templates";

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

const encodeAssetSrc = (path: string) => encodeURI(path);

const voucherImages = [
  { alt: "Bronze", src: encodeAssetSrc("/Asset 1@4x.png") },
  { alt: "Silver", src: encodeAssetSrc("/Asset 3@4x.png") },
  { alt: "Gold", src: encodeAssetSrc("/Asset 2@4x.png") },
  { alt: "Platinum", src: encodeAssetSrc("/Asset 5@4x.png") },
  { alt: "Diamond", src: encodeAssetSrc("/Asset 4@4x.png") },
];

export default function GreetingCard({
  formData,
  serviceName,
}: GreetingCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isExtraSmall, setIsExtraSmall] = useState(false);
  const [paidServiceName, setPaidServiceName] = useState<string | null>(
    serviceName ?? null
  );
  const [ignoreApiService, setIgnoreApiService] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [receiverEmailSent, setReceiverEmailSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [saveCountdown, setSaveCountdown] = useState(0);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const [countdown, setCountdown] = useState(10);

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
    const updateResponsiveFlags = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsExtraSmall(width < 360);
    };

    updateResponsiveFlags();
    window.addEventListener("resize", updateResponsiveFlags);
    return () => window.removeEventListener("resize", updateResponsiveFlags);
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
            const price =
              typeof voucher.price === "number" ? voucher.price : null;
            if (voucher && voucher.name) {
              console.log(
                "Got service from sessionStorage (lastSelectedVoucher):",
                voucher.name,
                "price:",
                price
              );
              setPaidServiceName(voucher.name);
              sessionStorage.setItem("paidServiceName", voucher.name);
              setIgnoreApiService(price === 0);
              return { name: voucher.name, isFree: price === 0 };
            }
          }
          
          if (savedServiceName) {
            console.log(
              "Got service from sessionStorage (paidServiceName):",
              savedServiceName
            );
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
        console.log(
          "⏭️ Skipping API call - free voucher selected from sessionStorage:",
          storageService.name
        );
        return;
      }
      
      // Nếu đã có service từ sessionStorage (không phải miễn phí), vẫn giữ nguyên và không override
      if (storageService && !storageService.isFree) {
        console.log(
          "✅ Service from sessionStorage exists, keeping it:",
          storageService.name
        );
        // Vẫn có thể gọi API để log, nhưng không override
      }
      
      try {
        const response = await fetch(
          `/api/get-paid-service?senderPhone=${encodeURIComponent(
            formData.senderPhone
          )}`
        );
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
              console.log(
                "✅ Keeping service from sessionStorage (selected voucher), ignoring API result:",
                storageService.name
              );
              return;
            }
            
            // Chỉ dùng API result nếu không có service trong sessionStorage
            setPaidServiceName(data.serviceName);
            console.log(
              "Updated paidServiceName from API to:",
              data.serviceName
            ); // Debug log

            if (typeof window !== "undefined") {
              try {
                const lastVoucher = sessionStorage.getItem(
                  "lastSelectedVoucher"
                );
                if (lastVoucher) {
                  const voucher = JSON.parse(lastVoucher);
                  // CHỈ update nếu voucher không phải miễn phí
                  if (voucher.price !== 0) {
                    voucher.name = data.serviceName;
                    sessionStorage.setItem(
                      "lastSelectedVoucher",
                      JSON.stringify(voucher)
                    );
                  }
                }
              } catch (e) {
                console.error("Error updating sessionStorage:", e);
              }
            }
          } else if (data.serviceName && ignoreApiService) {
            console.log(
              "⏭️ Ignoring API result because free voucher is selected"
            );
          }
        } else {
          const errorText = await response.text();
          console.error(
            "Failed to fetch paid service:",
            response.status,
            errorText
          );
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
      console.log(
        "⏭️ Skipping API call - free voucher selected from sessionStorage"
      );
    }
  }, [formData.senderPhone, ignoreApiService]);

  // Auto-send email to receiver when greeting card is first displayed
  useEffect(() => {
    // Wait a bit for component to fully mount and data to be ready
    const timer = setTimeout(async () => {
      if (formData.receiverEmail && !receiverEmailSent) {
        console.log("📧 Auto-sending greeting card email to receiver...");

        try {
          const emailTemplate = createGreetingCardReceiverEmail({
            senderName: formData.senderName,
            receiverName: formData.receiverName,
            message: formData.message,
            serviceName: paidServiceName || undefined,
            orderId: undefined, // Not available in greeting card context
          });

          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: formData.receiverEmail,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              senderName: formData.senderName,
              receiverName: formData.receiverName,
            }),
          });

          if (emailResponse.ok) {
            console.log(
              "✅ Greeting card email sent to receiver:",
              formData.receiverEmail
            );
            setReceiverEmailSent(true);
          } else {
            const errorText = await emailResponse.text();
            console.warn(
              "⚠️ Failed to send greeting card email to receiver:",
              errorText
            );
          }
        } catch (emailError) {
          console.error(
            "❌ Error sending greeting card email to receiver:",
            emailError
          );
        }
      }
    }, 2000); // Wait 2 seconds after component mounts

    return () => clearTimeout(timer);
  }, [
    formData.receiverEmail,
    formData.senderName,
    formData.receiverName,
    formData.message,
    paidServiceName,
    receiverEmailSent,
  ]);

  // Countdown timer for first save on mobile
  useEffect(() => {
    if (!showCountdown) return;

    if (countdown <= 0) {
      setShowCountdown(false);
      setCountdown(10);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showCountdown, countdown]);

  // Countdown timer for save button (5 seconds)
  useEffect(() => {
    if (saveCountdown <= 0) {
      setIsSaveDisabled(false);
      return;
    }

    setIsSaveDisabled(true);
    const timer = setTimeout(() => {
      setSaveCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [saveCountdown]);

  // Responsive character-per-line settings
  const maxCharsMessage = isExtraSmall ? 20 : isMobile ? 32 : 70;
  const maxCharsBody = isExtraSmall ? 20 : isMobile ? 32 : 65;
  const maxCharsSenderName = isExtraSmall ? 15 : isMobile ?18 : 24;

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
      if (
        normalizedName.includes("500.000") ||
        normalizedName.includes("500000")
      ) {
        console.log("Matched: Cash Voucher 500.000VNĐ");
        return "voucher Cash Voucher 500.000VNĐ";
      } else if (
        normalizedName.includes("200.000") ||
        normalizedName.includes("200000")
      ) {
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
    const holidayPhrase = "Chúc mừng ngày Quốc tế Phụ nữ!";
    const closingLines = [
      "ngọt ngào nhất cho làn da.",
      "\nChúc bạn luôn là phiên bản rực rỡ nhất của chính mình và nhớ tự thưởng 45 phút chăm da cho bản thân và người thương trong dịp này nhé.",
      "Cảm ơn bạn đã cho nhà Cáo cơ hội đồng hành cùng hành trình xinh đẹp ấy.",
      holidayPhrase,
    ];
    const trailingText = `${closingLines[0]}${closingLines
      .slice(1)
      .map((line) => `\n${line}`)
      .join("")}`;
    const buildMessage = (prefix: string) => `${prefix} ${trailingText}`;
    
    if (paidServiceName) {
      // Normalize service name for comparison (lowercase, remove extra spaces & diacritics)
      const normalizedName = normalizeText(paidServiceName);
      console.log("getDynamicBodyContent - normalizedName:", normalizedName);
      
      // Check for specific service names (check more specific ones first)
      if (
        normalizedName.includes("500.000") ||
        normalizedName.includes("500000")
      ) {
        return buildMessage("voucher Cash Voucher 500.000VNĐ");
      } else if (
        normalizedName.includes("200.000") ||
        normalizedName.includes("200000")
      ) {
        return buildMessage("voucher Cash Voucher 200.000VNĐ");
      } else if (
        normalizedName.includes("dịch vụ cộng thêm") ||
        normalizedName.includes("cong them") ||
        normalizedName === "dịch vụ cộng thêm" ||
        normalizedName.includes("service-basic") ||
        normalizedName.startsWith("dịch vụ")
      ) {
        console.log("getDynamicBodyContent - Matched Dịch vụ Cộng thêm");
        return buildMessage(
          "voucher Dịch vụ Cộng thêm trị giá lên đến 299.000VNĐ"
        );
      } else {
        console.log(
          "getDynamicBodyContent - No match, using:",
          paidServiceName
        );
        return buildMessage(`voucher ${paidServiceName}`);
      }
    }
    console.log("getDynamicBodyContent - No paidServiceName, using default");
    return buildMessage("voucher Dịch vụ Cộng thêm trị giá lên đến 299.000VNĐ");
  };

  const dynamicBodyContent = getDynamicBodyContent();
  const combinedBodyText = `${t.faceWashGreeting} ${formData.receiverName} ${dynamicBodyContent}`;

  const normalizeToken = (token: string) =>
    token.toLowerCase().replace(/[.,!?:;"'""()\[\]{}]/g, "");
  const toNormalizedWordSet = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .split(/\s+/)
        .map((w) => normalizeToken(w))
        .filter(Boolean)
    );
  const highlightWords = toNormalizedWordSet(highlightPhrase);
  const holidayWords = toNormalizedWordSet("chúc mừng ngày quốc tế phụ nữ!");
  const isPriceToken = (token: string) => {
    const compact = token.toLowerCase().replace(/[^a-z0-9]/g, "");
    // Check for VNĐ, vnd, or price patterns like 299000, 200000, 500000
    return (
      (/\d/.test(compact) &&
        (compact.endsWith("vnd") || compact.includes("vnd"))) ||
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
    const normalizedText = normalizeText(text).replace(
      /[.,!?:;"'""()\[\]{}]/g,
      ""
    );
    
    if (paidServiceName) {
      // Normalize service name for comparison (lowercase, remove extra spaces & diacritics)
      const normalizedName = normalizeText(paidServiceName);
      
      // Check for specific service names (check more specific ones first)
      if (
        normalizedName.includes("500.000") ||
        normalizedName.includes("500000")
      ) {
        return (
          normalizedText.includes("cash voucher 500000") ||
          normalizedText.includes("voucher cash voucher 500000") ||
          normalizedText.includes("cash voucher 500.000")
        );
      } else if (
        normalizedName.includes("200.000") ||
        normalizedName.includes("200000")
      ) {
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
        console.log(
          "containsVoucherPhrase - Matched Dịch vụ Cộng thêm for text:",
          text
        );
        return (
          normalizedText.includes("voucher dịch vụ cộng thêm") ||
          normalizedText.includes("dịch vụ cộng thêm") ||
          normalizedText.includes("299000vnd") ||
          normalizedText.includes("299.000vnd") ||
          normalizedText.includes(
            "voucher dịch vụ cộng thêm trị giá lên đến 299000vnd"
          ) ||
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

    // Wait for images to load - improved for mobile
    const images = node.querySelectorAll("img");
    const imagePromises = Array.from(images).map((img) => {
      // Ensure image src is absolute URL for html-to-image
      const currentSrc = img.getAttribute("src") || img.src;
      if (currentSrc && currentSrc.startsWith("/")) {
        const absoluteSrc = window.location.origin + currentSrc;
        // Only update if different to avoid unnecessary reloads
        if (img.src !== absoluteSrc) {
          img.src = absoluteSrc;
        }
      }
      
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      
        return new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Image load timeout:", img.src);
          resolve();
        }, 3000);
        
        const onLoad = () => {
          clearTimeout(timeout);
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
          resolve();
        };
        
        const onError = () => {
          clearTimeout(timeout);
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
          console.warn("Image load error:", img.src);
          resolve();
        };
        
        img.addEventListener("load", onLoad);
        img.addEventListener("error", onError);
      });
    });
    
    await Promise.all(imagePromises);
    
    // Additional delay for mobile to ensure all rendering is complete
    const isMobileExport = window.innerWidth < 640;
    if (isMobileExport) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Force reflow to ensure all styles are applied
    void node.offsetHeight;
    
    // Double-check all images are loaded
    const unloadedImages = Array.from(images).filter(
      (img) => !img.complete || img.naturalWidth === 0
    );
    if (unloadedImages.length > 0) {
      console.warn("Some images may not be loaded:", unloadedImages.length);
      // Wait a bit more for mobile
      if (isMobileExport) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Use html-to-image with consistent settings
    const { toPng } = await import("html-to-image");
    const rect = node.getBoundingClientRect();
    const targetWidth = isMobileExport
      ? Math.min(Math.round(rect.width), 900)
      : Math.min(Math.round(rect.width * 1.5), 1200);
    const targetHeight = Math.round((rect.height / rect.width) * targetWidth);
    const pixelRatio = isMobileExport ? 1.2 : 1.4;

    return toPng(node, {
      cacheBust: true, // Enable cache busting for mobile
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

    const isDataUrl =
      typeof dataUrl === "string" && dataUrl.startsWith("data:image");
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
      alert("Thiệp đang được chuẩn bị! Vui lòng đợi một chút và thử lại nhé 💝");
    }
  };

  // Helper function to send greeting card email to sender (only once)
  const sendGreetingCardEmailToSender = async () => {
    if (emailSent || !formData.senderEmail) return;

    try {
      const emailTemplate = createGreetingCardSentEmail({
        senderName: formData.senderName,
        receiverName: formData.receiverName,
        message: formData.message,
      });

      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formData.senderEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          senderName: formData.senderName,
          receiverName: formData.receiverName,
        }),
      });

      if (emailResponse.ok) {
        console.log(
          "✅ Greeting card email sent to sender:",
          formData.senderEmail
        );
        setEmailSent(true);
      } else {
        console.warn("⚠️ Failed to send greeting card email to sender");
      }
    } catch (emailError) {
      console.error(
        "❌ Error sending greeting card email to sender:",
        emailError
      );
      // Don't show error to user, email is optional
    }
  };

  // Helper function to send greeting card email to receiver
  const sendGreetingCardEmailToReceiver = async () => {
    if (!formData.receiverEmail) {
      console.log("ℹ️ No receiver email, skipping receiver notification");
      return;
    }

    if (receiverEmailSent) {
      console.log("ℹ️ Receiver email already sent, skipping");
      return;
    }

    try {
      const emailTemplate = createGreetingCardReceiverEmail({
        senderName: formData.senderName,
        receiverName: formData.receiverName,
        message: formData.message,
        serviceName: paidServiceName || undefined,
      });

      const emailResponse = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formData.receiverEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          senderName: formData.senderName,
          receiverName: formData.receiverName,
        }),
      });

      if (emailResponse.ok) {
        console.log(
          "✅ Greeting card email sent to receiver:",
          formData.receiverEmail
        );
        setReceiverEmailSent(true);
      } else {
        const errorText = await emailResponse.text();
        console.warn(
          "⚠️ Failed to send greeting card email to receiver:",
          errorText
        );
      }
    } catch (emailError) {
      console.error(
        "❌ Error sending greeting card email to receiver:",
        emailError
      );
      // Don't show error to user, email is optional
    }
  };

  // Send emails to both sender and receiver
  const sendGreetingCardEmails = async () => {
    await Promise.all([
      sendGreetingCardEmailToSender(),
      sendGreetingCardEmailToReceiver(),
    ]);
  };

  const handleScreenshot = async () => {
    if (isSaving || isSaveDisabled) return;
    
    // On mobile, first save shows countdown, subsequent saves require refresh
    if (isMobile && saveCount >= 1) {
      const shouldRefresh = confirm(
        "Để đảm bảo thiệp đẹp nhất, vui lòng làm mới trang trước khi lưu lại nhé! 💝\n\nBạn có muốn làm mới trang ngay bây giờ không?"
      );
      if (shouldRefresh) {
        window.location.reload();
      }
      return;
    }
    
    // Start 5 second countdown before allowing save
    setSaveCountdown(5);
    setIsSaveDisabled(true);
    
    // Wait for countdown to finish (5 seconds)
    // Countdown is handled by useEffect, we just wait here
    await new Promise((resolve) => setTimeout(resolve, 5000));
    setIsSaveDisabled(false);
    setSaveCountdown(0);
    
    // First save on mobile: show countdown modal
    if (isMobile && saveCount === 0) {
      setShowCountdown(true);
      setCountdown(10);
    }
    
    setIsSaving(true);
    try {
      const dataUrl = await exportCardAsPng();
      await triggerDownload(dataUrl);

      // Send email notifications after successful card download
      await sendGreetingCardEmails();
      
      // Increment save count after successful save
      setSaveCount((prev) => prev + 1);
      
      // Close countdown modal after successful save
      if (showCountdown) {
        setShowCountdown(false);
        setCountdown(10);
      }
    } catch (error) {
      console.error("Không thể tạo ảnh thiệp:", error);
      // Close countdown modal on error
      if (showCountdown) {
        setShowCountdown(false);
        setCountdown(10);
      }
      // Reset save countdown on error
      setIsSaveDisabled(false);
      setSaveCountdown(0);
      alert("Thiệp đang được chuẩn bị! Vui lòng đợi một chút và thử lại nhé 💝");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
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
              // Send email notifications after successful share
              await sendGreetingCardEmails();
              return;
            }
          }
          
          // Fallback to download if share not available
          const url = URL.createObjectURL(blob);
          await triggerDownload(url, { skipBackend: true });
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          // Send email notifications after successful download
          await sendGreetingCardEmails();
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
          // Send email notifications after successful share
          await sendGreetingCardEmails();
          return;
        }
      }

      // Final fallback to download (desktop or when navigator.share not available)
      if (blob) {
        const fileName = `foxie-card-${Date.now()}.png`;
        try {
          saveAs(blob, fileName);
          setTimeout(() => {
            alert(
              "Ảnh đã được tải xuống! Kiểm tra thư mục Downloads hoặc Gallery của bạn."
            );
          }, 500);
          // Send email notifications after successful download
          await sendGreetingCardEmails();
        } catch (downloadError) {
          console.warn(
            "FileSaver download failed, falling back to generic download:",
            downloadError
          );
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          // Send email notifications after successful download
          await sendGreetingCardEmails();
        }
      } else {
        await triggerDownload(dataUrl);
        // Send email notifications after successful download
        await sendGreetingCardEmails();
      }

      const fallbackText = `${t.shareText} ${formData.senderName} gửi đến ${formData.receiverName}: ${formData.message}`;
      try {
        await navigator.clipboard?.writeText(fallbackText);
        alert(t.shareSuccess);
        // Send email notifications after successful share
        await sendGreetingCardEmails();
      } catch (clipboardError) {
        console.warn("Không thể sao chép vào clipboard:", clipboardError);
        alert(t.shareError);
      }
    } catch (error) {
      console.error("Không thể chia sẻ thiệp:", error);
      alert("Thiệp đang được chuẩn bị! Vui lòng đợi một chút và thử lại nhé 💝");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-4 md:py-8 text-black">
      {/* Countdown Modal for first save on mobile */}
      {showCountdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mx-4 max-w-sm w-full text-center">
            <div className="mb-4">
              <div className="text-6xl mb-4">💝</div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Thiệp đang được chuẩn bị!
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Vui lòng đợi một chút để thiệp được tạo với chất lượng đẹp nhất nhé
              </p>
            </div>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-3xl font-bold shadow-lg">
                {countdown}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              />
            </div>
            <button
              onClick={() => {
                setShowCountdown(false);
                setCountdown(10);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      
      {/* <LanguageSwitcher /> */}
      {/* Desktop: Show buttons at top */}
      <div className="hidden sm:flex w-full justify-end gap-2 px-4 sm:px-6 mb-2">
        <Link
          href="https://cuahang.facewashfox.com/"
          className="inline-flex items-center justify-center rounded-full border border-orange-300 bg-white/90 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-50 transition"
        >
          Xem chi nhánh
        </Link>
        <a
          href="tel:0889866666"
          className="inline-flex items-center justify-center rounded-full border border-orange-300 bg-orange-500/90 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition"
        >
          Gọi hotline
        </a>
      </div>
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => {
              if (isNavigating) return;
              setIsNavigating(true);
              router.push("/voucher");
            }}
            disabled={isNavigating}
            className="flex items-center gap-2 hover:bg-red-50 border border-red-200 bg-transparent px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNavigating ? (
              <>
                <span className="animate-spin">⏳</span> Đang chuyển...
              </>
            ) : (
              <>← Tiếp tục mua sắm</>
            )}
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
                  src={encodeAssetSrc("/Element Promotion8.3/Asset 1@4x.png")}
                  alt="falling decoration"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>

              <div className="absolute -top-20 left-12 w-24 h-24 animate-fall-down-left-delayed-1 opacity-25 ">
                <Image
                  src={encodeAssetSrc("/Element Promotion8.3/Asset 6@4x.png")}
                  alt="falling decoration"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>

              <div className="absolute -top-20 left-12 w-12 h-12 animate-fall-down-left-delayed-2 opacity-20 ">
                <Image
                  src={encodeAssetSrc("/Element Promotion8.3/Asset 3@4x.png")}
                  alt="falling decoration"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>

              {/* Right side falling elements */}
              <div className="absolute -top-20 right-10 w-32 h-32 animate-fall-down-right opacity-35 ">
                <Image
                  src={encodeAssetSrc("/Element Promotion8.3/Asset 7@4x.png")}
                  alt="falling decoration"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>

              <div className="absolute -top-20 right-12 w-24 h-24 animate-fall-down-right-delayed-1 opacity-35 ">
                <Image
                  src={encodeAssetSrc("/Element Promotion8.3/Asset 5 1@4x.png")}
                  alt="falling decoration"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>

              <div className="absolute -top-20 right-12 w-14 h-14 animate-fall-down-right-delayed-2 opacity-35 ">
                <Image
                  src={encodeAssetSrc("/Element Promotion8.3/Asset 11@4x.png")}
                  alt="falling decoration"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>

              <div className="absolute -top-20 right-12 w-20 h-20 animate-fall-down-right opacity-20">
                <Image
                  src={encodeAssetSrc("/Element Promotion8.3/Asset 3@4x.png")}
                  alt="falling decoration"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
            </div>

            <div className="absolute -top-20 left-1/2 w-18 h-18 animate-fall-down-left opacity-15 ">
              <Image
                src={encodeAssetSrc("/Element Promotion8.3/Asset 1@4x.png")}
                alt="falling decoration"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>

            <div className="absolute -top-20 left-1/2 w-20 h-20 animate-fall-down-right-delayed-1 opacity-20 ">
              <Image
                src={encodeAssetSrc("/Element Promotion8.3/Asset 4@4x.png")}
                alt="falling decoration"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <header className="w-full">
              <Image
                src={encodeAssetSrc("/For web/Letter Header.png")}
                alt="Foxie Club 20.10 Special - Món quà dành tặng cho bạn"
                width={1920}
                height={600}
                priority
                className="w-full h-auto object-cover"
                unoptimized
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
                      ? "top-50 left-8 w-16 opacity-70"
                      : "top-73 left-3 w-24 sm:w-28 md:w-32 opacity-80"
                  } animate-float-y z-100`}
                >
                  <Image
                    src={encodeAssetSrc("/Element Promotion8.3/Asset 5@4x.png")}
                    alt="decorative fox"
                    width={256}
                    height={256}
                    className="w-full h-auto drop-shadow-md rotate-[-8deg]"
                    aria-hidden
                    unoptimized
                  />
                </div>
                <div
                  className={`absolute ${
                    isMobile
                      ? "bottom-80 left-10 w-16 opacity-70"
                      : "bottom-100 left-2 w-20 sm:w-24 md:w-28 opacity-80"
                  } animate-float-x z-100`}
                >
                  <Image
                    src={encodeAssetSrc("/Element Promotion8.3/Asset 3@4x.png")}
                    alt="decorative fox"
                    width={256}
                    height={256}
                    className="w-full h-auto drop-shadow-md"
                    aria-hidden
                    unoptimized
                  />
                </div>
                <div
                  className={`absolute ${
                    isMobile
                      ? "bottom-68 right-5 w-16 opacity-80"
                      : "bottom-[350] right-8 w-20 sm:w-20 md:w20 opacity-100"
                  } animate-swing-60 z-100`}
                >
                  <Image
                    src={encodeAssetSrc("/Element Promotion8.3/Asset 2 1@4x.png")}
                    alt="decorative sun"
                    width={256}
                    height={256}
                    className="w-full h-auto drop-shadow-md"
                    aria-hidden
                    unoptimized
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
                  src={encodeAssetSrc("/Asset 17@4x.png")}
                  alt="decorative fox"
                  width={256}
                  height={256}
                  className="w-full h-auto transform drop-shadow-md rotate-[-8deg] "
                  aria-hidden
                  unoptimized
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
                          fontFamily:
                            "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
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
                        fontFamily:
                          "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
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
                                fontFamily:
                                  "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
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
                          src={encodeAssetSrc("/Sticker 1@4x.png")}
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                          unoptimized
                        />
                        <Image
                          src={encodeAssetSrc("/Sticker 4@4x.png")}
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                          unoptimized
                        />
                        <Image
                          src={encodeAssetSrc("/Sticker 5@4x.png")}
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-10 h-auto object-cover"
                          unoptimized
                        />
                        <Image
                          src={encodeAssetSrc("/Sticker 6@4x.png")}
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                          unoptimized
                        />
                        <Image
                          src={encodeAssetSrc("/Sticker 7@4x.png")}
                          alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                          width={50}
                          height={50}
                          className="w-4 h-auto object-cover"
                          unoptimized
                        />
                      </span>
                    </div>

                    {/* Fixed content + voucher paragraph combined */}
                    {wrapTextWithIndices(combinedBodyText, maxCharsBody).map(
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
                                fontFamily:
                                  "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
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
                                    holidayWords.has(norm) ||
                                    isPriceToken(tk) ||
                                    containsPrice(tk)
                                  ) {
                                    return (
                                      <strong
                                        key={i}
                                        className="text-[#eb3526]"
                                      >
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
                            src={encodeAssetSrc("/nguoiGui.png")}
                            alt="Thanks"
                            width={50}
                            height={50}
                            className="w-8 sm:w-12 h-auto ml-4 md:ml-5 mb-8 md:mb-9 opacity-15"
                            unoptimized
                          />
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center px-2">
                          <span
                            className="text-base md:text-[24px] text-orange-500 text-center leading-relaxed whitespace-pre-wrap break-words"
                            style={{
                              fontFamily:
                                "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
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
                          fontFamily:
                            "var(--font-bonheur-royale), 'Bonheur Royale', cursive",
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
            {/* Booking QR (included inside export area so it appears in saved image) */}
            <div className="mt-6 flex flex-col items-center gap-3 px-4 pb-4">
              <p className="text-sm text-gray-700 text-center">
                Quét mã QR bên dưới để đặt lịch tại Face Wash Fox
              </p>
              <Image
                src={encodeAssetSrc("/qr-dat-lich.png")}
                alt="QR đặt lịch tại Face Wash Fox"
                width={200}
                height={200}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-white border border-orange-200 shadow-md"
                unoptimized
              />
            </div>

            {/* Letter Footer */}
            <footer className="w-full mt-4 relative">
              <Image
                src={encodeAssetSrc("/For web/Letter Footer.png")}
                alt="Foxie Club Calendar - Flourishing pen-hearted traodinary"
                width={1920}
                height={400}
                className="w-full h-auto object-cover"
                unoptimized
              />
            </footer>
          </div>
        </div>

        {/* Mobile: Show buttons above action buttons */}
        <div className="flex sm:hidden w-full justify-center gap-2 px-4 mt-8 mb-4">
          <Link
            href="https://cuahang.facewashfox.com/"
            className="inline-flex items-center justify-center rounded-full border border-orange-300 bg-white/90 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm hover:bg-orange-50 transition"
          >
            Xem chi nhánh
          </Link>
          <a
            href="tel:0889866666"
            className="inline-flex items-center justify-center rounded-full border border-orange-300 bg-orange-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition"
          >
            Gọi hotline
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8">
          <button
            onClick={handleScreenshot}
            disabled={isSaving || isSharing || isSaveDisabled}
            className="hidden sm:flex items-center justify-center gap-2 bg-gradient-to-r from-orange-300 to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-full shadow-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span> Đang lưu...
              </>
            ) : isSaveDisabled && saveCountdown > 0 ? (
              <>
                <span className="text-lg font-bold">⏳ {saveCountdown}s</span>
                <span className="text-sm">Đang chuẩn bị...</span>
              </>
            ) : (
              <>📱 {t.saveCardButton}</>
            )}
          </button>
          <button
            onClick={handleShare}
            disabled={isSaving || isSharing}
            className="flex sm:hidden items-center justify-center gap-2 bg-gradient-to-r from-yellow-200 to-yellow-500 hover:from-yellow-400 hover:to-green-700 text-white px-6 py-3 rounded-full shadow-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? (
              <>
                <span className="animate-spin">⏳</span> Đang chia sẻ...
              </>
            ) : (
              <>{isMobile ? t.shareAndSaveButton : ""}</>
            )}
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
