"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Gift, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GodRays, MeshGradient } from "@paper-design/shaders-react";
import Image from "next/image";
import VoucherSelection, { VoucherOption } from "./voucher-selection";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import momoLogoCircle from "../../../public/Logo MoMo Circle.png";

interface FormData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  message: string;
}

const HERO_COLORS = {
  primary: "#FF6B2C",
  primaryDark: "#E0561E",
  secondary: "#FF9248",
  accent: "#FFD8BC",
  gradientLight: "#FFF8F1",
  gradientMid: "#FFE7D2",
  gradientDark: "#FFD2B2",
};

export default function Hero() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherOption | null>(
    null
  );
  const [formData, setFormData] = useState<FormData | null>(null);
  const [momoQrValue, setMomoQrValue] = useState<string | null>(null);
  const [momoDeeplinkUrl, setMomoDeeplinkUrl] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const qrRef = useRef<SVGSVGElement | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<"momo" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"momo-wallet" | null>(
    null
  );
  const [mobileQrPreview, setMobileQrPreview] = useState<string | null>(null);
  const [qrLogoDataUrl, setQrLogoDataUrl] = useState<string | null>(null);
  const [showMobilePaymentGuide, setShowMobilePaymentGuide] = useState(false);
  const [mobileGuideDismissed, setMobileGuideDismissed] = useState(false);
  const hasAttemptedMoMoRef = useRef(false);
  const [isPaymentReady, setIsPaymentReady] = useState(false);
  const [isCtaLoading, setIsCtaLoading] = useState(false);

  const submitFreeVoucherToSheet = useCallback(async () => {
    if (!formData || !selectedVoucher || selectedVoucher.price > 0) {
      return;
    }

    try {
      const orderId = `FREE_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setCurrentOrderId(orderId);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("formData", JSON.stringify(formData));
        sessionStorage.setItem("paidServiceName", selectedVoucher.name);
        sessionStorage.setItem("currentOrderId", orderId);
      }

      await fetch("/api/payment/save-free-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          serviceName: selectedVoucher.name,
          formData,
        }),
      });
    } catch (error) {
      console.error("Không thể gửi dữ liệu miễn phí lên Google Sheets:", error);
    }
  }, [formData, selectedVoucher]);

  const handleExpand = () => {
    if (!selectedVoucher || isCtaLoading) return;

    setIsCtaLoading(true);

    // Save selected voucher to storage for later use (payment + greeting card)
    sessionStorage.setItem("lastSelectedVoucher", JSON.stringify(selectedVoucher));
      sessionStorage.setItem("paidServiceName", selectedVoucher.name);

    // Với voucher trả phí: chỉ mở popup thanh toán
      setIsExpanded(true);
    setIsCtaLoading(false);
  };

  const handleContinue = async () => {
    if (isCtaLoading) return;
    setIsCtaLoading(true);

    try {
    await submitFreeVoucherToSheet();
    // Redirect đến trang chủ để hiển thị thiệp chúc mừng
    router.push("/?showGreetingCard=1");
    } finally {
      // Cho phép bấm lại nếu có lỗi / user quay lại
      setIsCtaLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) {
      return "Miễn phí";
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setPaymentProvider(null);
    setPaymentMethod(null);
    setMobileGuideDismissed(false);
    setIsPaymentReady(false);
    setMomoQrValue(null);
    setMomoDeeplinkUrl(null);
    setCurrentOrderId(null);
  };

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setPaymentProvider(null);
      setPaymentMethod(null);
    }
  }, [isExpanded]);

  useEffect(() => {
    let isMounted = true;
    const loadLogo = async () => {
      try {
        const response = await fetch("/Logo MoMo Circle.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string" && isMounted) {
            setQrLogoDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Không thể tải logo MoMo:", error);
      }
    };
    loadLogo();
    return () => {
      isMounted = false;
    };
  }, []);

  const openMoMoApp = useCallback(() => {
    if (!momoDeeplinkUrl || typeof window === "undefined") return;
    window.location.href = momoDeeplinkUrl;
  }, [momoDeeplinkUrl]);

  useEffect(() => {
    if (
      !isMobile ||
      !momoDeeplinkUrl ||
      paymentMethod !== "momo-wallet" ||
      typeof window === "undefined" ||
      mobileGuideDismissed
    ) {
      setShowMobilePaymentGuide(false);
      hasAttemptedMoMoRef.current = false;
      if (!momoDeeplinkUrl) {
        setMobileGuideDismissed(false);
      }
      return;
    }

    setShowMobilePaymentGuide(true);

    if (!hasAttemptedMoMoRef.current) {
      hasAttemptedMoMoRef.current = true;
      const timer = window.setTimeout(() => {
        // keep guide visible if user returns from MoMo
      }, 1200);
      openMoMoApp();
      return () => window.clearTimeout(timer);
    }
  }, [
    isMobile,
    momoDeeplinkUrl,
    paymentMethod,
    openMoMoApp,
    mobileGuideDismissed,
  ]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    // Load form data from sessionStorage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("formData");
      if (stored) {
        try {
          setFormData(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing form data:", e);
        }
      }
    }
  }, []);

  // Auto-save selected voucher to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedVoucher && typeof window !== "undefined") {
      console.log(
        "Auto-saving selectedVoucher to sessionStorage:",
        selectedVoucher.name
      );
      sessionStorage.setItem(
        "lastSelectedVoucher",
        JSON.stringify(selectedVoucher)
      );
      sessionStorage.setItem("paidServiceName", selectedVoucher.name);
    }
  }, [selectedVoucher]);

  // Check for auto-open payment popup from URL params
  useEffect(() => {
    const shouldOpenPayment = searchParams.get("openPayment");
    const voucherId = searchParams.get("voucherId");

    if (shouldOpenPayment === "true" && voucherId) {
      // Find the voucher by ID and auto-select it
      const voucherOptions = [
        {
          id: "service-basic",
          name: "Dịch vụ Cộng thêm",
          price: 0,
          type: "service" as const,
          description:
            "Voucher dịch vụ chăm sóc da chuyên nghiệp 269.000đ - 299.000đ",
          services: [
            "Tẩy tế bào chết",
            "Đắp mặt nạ dưỡng ẩm",
            "Massage mặt thư giãn",
            "Chăm sóc da theo nhu cầu",
          ],
          benefits: [
            "Làm sạch sâu lỗ chân lông",
            "Cung cấp độ ẩm cho da",
            "Giảm stress, thư giãn tinh thần",
            "Da sáng mịn, tươi trẻ hơn",
          ],
        },
        {
          id: "cash-200k",
          name: "Cash Voucher 200.000đ",
          price: 200000,
          type: "cash" as const,
          description: "Voucher tiền mặt trị giá 200.000 VNĐ",
          services: [
            "Sử dụng cho mọi dịch vụ tại Face Wash Fox",
            "Áp dụng cho tất cả sản phẩm",
            "Có thể kết hợp với các chương trình khuyến mãi khác",
          ],
          benefits: [
            "Linh hoạt trong việc sử dụng",
            "Không giới hạn thời gian sử dụng",
            "Có thể tặng cho người thân",
            "Áp dụng tại tất cả chi nhánh",
          ],
        },
        {
          id: "cash-500k",
          name: "Cash Voucher 500.000đ",
          price: 500000,
          type: "cash" as const,
          description: "Voucher tiền mặt trị giá 500.000 VNĐ",
          services: [
            "Sử dụng cho mọi dịch vụ tại Face Wash Fox",
            "Áp dụng cho tất cả sản phẩm",
            "Có thể kết hợp với các chương trình khuyến mãi khác",
            "Ưu tiên đặt lịch dịch vụ cao cấp",
          ],
          benefits: [
            "Linh hoạt trong việc sử dụng",
            "Không giới hạn thời gian sử dụng",
            "Có thể tặng cho người thân",
            "Áp dụng tại tất cả chi nhánh",
            "Được tư vấn chăm sóc da miễn phí",
          ],
        },
        {
          id: "test-2k",
          name: "Voucher test thanh toán 2.000đ",
          price: 2000,
          type: "cash" as const,
          description: "Voucher dùng để kiểm thử luồng thanh toán chỉ 2.000đ",
          services: [
            "Dùng để test quy trình thanh toán MoMo",
            "Không tạo quyền lợi thực tế",
            "Có thể chọn nhiều lần để kiểm thử",
          ],
          benefits: [
            "Thanh toán nhanh gọn với giá trị nhỏ",
            "Giúp kiểm tra email/ghi nhận đơn",
            "Không áp dụng ưu đãi thực tế",
          ],
        },
      ];

      const foundVoucher = voucherOptions.find((v) => v.id === voucherId);
      if (foundVoucher) {
        setSelectedVoucher(foundVoucher);

        // If it's a paid voucher, open the payment popup
        if (foundVoucher.price > 0) {
          setIsExpanded(true);
        }

        // Clean up URL params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("openPayment");
        newUrl.searchParams.delete("voucherId");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, [searchParams]);

  const persistData = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    // Lưu vào cả sessionStorage và localStorage
    // localStorage là backup cho mobile (sessionStorage có thể bị xóa khi redirect)
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Could not save to sessionStorage: ${key}`, e);
    }
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Could not save to localStorage: ${key}`, e);
    }
  };

  useEffect(() => {
    // Generate MoMo payment URL when voucher is selected and form is expanded
    // Skip if voucher is free (price = 0)
    const generateMoMoPayment = async () => {
      if (
        isExpanded &&
        selectedVoucher &&
        selectedVoucher.price > 0 &&
        paymentMethod === "momo-wallet" &&
        isPaymentReady
      ) {
        try {
          const orderId = `ORDER_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          setCurrentOrderId(orderId);
          const response = await fetch("/api/payment/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              amount: selectedVoucher.price,
              serviceName: selectedVoucher.name,
            }),
          });

          if (response.ok) {
            const data = await response.json();

            if (formData) {
              try {
                // Lưu formData vào sessionStorage TRƯỚC khi tạo payment để đảm bảo có data khi redirect về
                const serializedFormData = JSON.stringify(formData);
                persistData("formData", serializedFormData);
                persistData("paidServiceName", selectedVoucher.name);
                persistData("currentOrderId", orderId);
                persistData(
                  "pendingOrderPayload",
                  JSON.stringify({
                    orderId,
                    amount: selectedVoucher.price,
                    serviceName: selectedVoucher.name,
                    formData,
                    createdAt: Date.now(),
                  })
                );
                console.log(
                  "✅ Saved formData to storage before payment:",
                  orderId
                );

                await fetch("/api/payment/save-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId,
                    amount: selectedVoucher.price,
                    serviceName: selectedVoucher.name,
                    formData,
                  }),
                });
              } catch (error) {
                console.error("Không thể lưu thông tin đơn hàng:", error);
              }
            }

            if (data.resultCode === 0) {
              const qrValue =
                data.qrCodeUrl ||
                data.qrCodeValue ||
                data.shortLink ||
                data.payUrl ||
                null;
              const deeplink =
                data.payUrl ||
                data.deeplink ||
                data.deepLink ||
                data.shortLink ||
                qrValue;

              setMomoQrValue(qrValue);
              setMomoDeeplinkUrl(deeplink);

              if (deeplink) {
                try {
                  window.location.href = deeplink;
                } catch (deeplinkError) {
                  console.warn("Không thể mở MoMo deeplink:", deeplinkError);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error creating MoMo payment:", error);
        }
      } else {
        // Reset when closed
        setMomoQrValue(null);
        setMomoDeeplinkUrl(null);
        setCurrentOrderId(null);
      }
    };

    generateMoMoPayment();
  }, [
    isExpanded,
    selectedVoucher,
    formData,
    paymentMethod,
    isPaymentReady,
    isMobile,
  ]);

  const handleDownloadQr = useCallback(async () => {
    if (
      !momoQrValue ||
      !qrRef.current ||
      paymentMethod !== "momo-wallet" ||
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      const serializer = new XMLSerializer();
      const svgMarkup = serializer.serializeToString(qrRef.current);
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      const canvasSize = 512;

      image.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const context = canvas.getContext("2d");

        if (!context) {
          URL.revokeObjectURL(svgUrl);
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvasSize, canvasSize);
        context.drawImage(image, 0, 0, canvasSize, canvasSize);
        URL.revokeObjectURL(svgUrl);

        const pngUrl = canvas.toDataURL("image/png");
        const filename = `foxie-momo-qr-${currentOrderId ?? "payment"}.png`;

        if (isMobile && typeof navigator !== "undefined") {
          try {
            const response = await fetch(pngUrl);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: "QR MoMo Face Wash Fox",
                text: "Nhấn lưu QR để thanh toán MoMo",
              });
              return;
            }
          } catch (shareError) {
            console.warn("Không thể chia sẻ trực tiếp QR:", shareError);
          }

          setMobileQrPreview(pngUrl);
        } else {
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        console.error("Không thể kết xuất QR để tải.");
      };

      image.src = svgUrl;
    } catch (error) {
      console.error("Tải QR thất bại:", error);
    }
  }, [currentOrderId, momoQrValue, isMobile, paymentMethod]);

  const handleDismissMobileGuide = useCallback(() => {
    setShowMobilePaymentGuide(false);
    setMobileGuideDismissed(true);
  }, []);

  const handleShowQrFromGuide = useCallback(() => {
    setShowMobilePaymentGuide(false);
    setMobileGuideDismissed(true);
    handleDownloadQr();
  }, [handleDownloadQr]);

  return (
    <>
      <div
        className={`relative flex min-h-[100svh] w-full flex-col px-4 sm:px-6 ${
          isMobile
            ? "items-stretch justify-start gap-8 py-10 pt-20"
            : "items-center justify-center py-12 sm:py-20"
        }`}
      >
        {/* Background */}
        {isMobile ? (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${HERO_COLORS.gradientLight} 0%, ${HERO_COLORS.gradientMid} 45%, ${HERO_COLORS.gradientDark} 100%)`,
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at top, ${HERO_COLORS.gradientLight} 0%, ${HERO_COLORS.gradientMid} 45%, ${HERO_COLORS.gradientDark} 100%)`,
            }}
          >
            <GodRays
              colorBack="#00000000"
              colors={["#FFF4E6", "#FFDCC2", "#FFB48A", "#FF8F4C"]}
              colorBloom="#FFEAD6"
              offsetX={0.85}
              offsetY={-1}
              intensity={1}
              spotty={0.45}
              midSize={10}
              midIntensity={0}
              density={0.12}
              bloom={0.15}
              speed={1}
              scale={1.6}
              frame={3332042.8159981333}
              style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                left: 0,
                top: 0,
              }}
            />
          </div>
        )}

        <div className="relative z-10 flex w-full justify-center sm:justify-end gap-2 mb-4 px-2 sm:px-0">
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

        <div
          className={`relative z-10 flex flex-col gap-4 sm:gap-6 ${
            isMobile
              ? "w-full max-w-2xl text-left items-start"
              : "items-center text-center"
          }`}
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[90%] tracking-[-0.03em] text-black mix-blend-exclusion max-w-3xl">
            Chọn Dịch Vụ Quà Tặng
          </h1>

          <p
            className={`text-base sm:text-lg md:text-xl leading-[160%] text-black max-w-4xl mb-6 ${
              isMobile ? "px-0 text-left" : "px-4 text-center"
            }`}
          >
            Vui lòng chọn loại quà tặng mà bạn muốn gửi đến người thương. Face
            Wash Fox cung cấp nhiều dịch vụ quà tặng khác nhau, bao gồm gói Dịch
            Vụ Cộng Thêm, Cash Voucher kèm thiệp chúc, thông điệp cá nhân và các
            hình thức chăm sóc đặc biệt. Tùy vào lựa chọn của bạn, hệ thống sẽ
            chuẩn bị nội dung phù hợp và áp dụng các ưu đãi đi kèm. Hãy chọn
            dịch vụ mà bạn mong muốn để tiếp tục.
          </p>

          {/* Voucher Selection Component */}
          <div
            className={`w-full ${
              isMobile ? "max-w-2xl px-0" : "max-w-6xl px-4"
            }`}
          >
            <VoucherSelection
              isMobile={isMobile}
              onVoucherSelect={setSelectedVoucher}
            />
          </div>
          <AnimatePresence initial={false}>
            {!isExpanded && (
              <motion.div
                className={`relative ${isMobile ? "w-full" : "inline-block"}`}
              >
                <motion.div
                  style={{
                    borderRadius: isMobile ? "24px" : "100px",
                    background: `linear-gradient(120deg, ${HERO_COLORS.primary} 0%, ${HERO_COLORS.secondary} 100%)`,
                  }}
                  layout
                  layoutId="cta-card"
                  className="absolute inset-0 items-center justify-center transform-gpu will-change-transform"
                ></motion.div>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout={false}
                  onClick={
                    selectedVoucher?.price === 0 ? handleContinue : handleExpand
                  }
                  disabled={!selectedVoucher || isCtaLoading}
                  className={`h-15 px-6 sm:px-8 py-3 text-lg sm:text-xl font-regular tracking-[-0.01em] relative ${
                    selectedVoucher
                      ? "text-[#E3E3E3] cursor-pointer"
                      : "text-[#E3E3E3]/50 cursor-not-allowed"
                  } ${isMobile ? "w-full rounded-2xl" : "rounded-full"}`}
                >
                  {selectedVoucher?.price === 0
                    ? isCtaLoading
                      ? "Đang xử lý..."
                      : "Tiếp tục"
                    : isCtaLoading
                    ? "Đang mở thanh toán..."
                    : "Thanh Toán Ngay"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isMobile &&
        showMobilePaymentGuide &&
        paymentMethod === "momo-wallet" &&
        momoDeeplinkUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl space-y-4">
              <div className="flex flex-col items-center gap-2">
                <Image
                  src={momoLogoCircle}
                  alt="MoMo logo"
                  width={72}
                  height={72}
                  className="w-16 h-16"
                />
                <h3 className="text-lg font-semibold text-[#a50064]">
                  Thanh toán nhanh qua Ví MoMo
                </h3>
                <p className="text-sm text-gray-600">
                  1. Bấm &quot;Mở Ví MoMo&quot; để chuyển sang app.
                  <br />
                  2. Nếu không tự mở được, xem mã QR để quét ngay.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openMoMoApp}
                  className="w-full rounded-full bg-[#a50064] px-4 py-3 text-white font-semibold shadow-lg"
                >
                  Mở Ví MoMo
                </button>
                <button
                  type="button"
                  onClick={handleShowQrFromGuide}
                  className="w-full rounded-full border border-[#a50064] px-4 py-3 text-[#a50064] font-semibold"
                >
                  Xem mã QR để quét
                </button>
              </div>
              <button
                type="button"
                onClick={handleDismissMobileGuide}
                className="text-sm text-gray-500 underline"
              >
                Đóng hướng dẫn
              </button>
            </div>
          </div>
        )}

      {isMobile && mobileQrPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl">
            <p className="text-base font-semibold text-[#a50064]">
              Nhấn giữ để lưu ảnh QR
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Nếu không thấy tuỳ chọn lưu, hãy chụp màn hình.
            </p>
            <Image
              src={mobileQrPreview}
              alt="QR MoMo preview"
              width={240}
              height={240}
              unoptimized
              className="mx-auto mt-4 w-full max-w-[240px] rounded-2xl border border-gray-200 h-auto"
            />
            <button
              type="button"
              onClick={() => setMobileQrPreview(null)}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#a50064] px-4 py-2 text-white font-semibold shadow-lg"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <div
            className={`fixed inset-0 z-50 flex ${
              isMobile ? "items-end" : "items-center"
            } justify-center p-0 sm:p-2`}
          >
            <motion.div
              layoutId="cta-card"
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: isMobile ? "32px 32px 0 0" : "24px",
                background: `linear-gradient(140deg, ${HERO_COLORS.primary} 0%, ${HERO_COLORS.secondary} 100%)`,
              }}
              layout
              className={`relative flex w-full transform-gpu will-change-transform ${
                isMobile
                  ? "max-h-[95vh] flex-col overflow-y-auto rounded-t-[32px] pb-6"
                  : "h-full overflow-y-auto rounded-[24px]"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                layout={false}
                transition={{ duration: 0.15, delay: 0.05 }}
                className="absolute h-full inset-0 overflow-hidden pointer-events-none"
                style={{
                  borderRadius: isMobile ? "32px 32px 0 0" : "24px",
                }}
              >
                <MeshGradient
                  speed={1}
                  colors={["#FFB267", "#FF8A3C", "#E35A12", "#FF6B2C"]}
                  distortion={0.8}
                  swirl={0.1}
                  grainMixer={0}
                  grainOverlay={0}
                  className="inset-0 sticky top-0"
                  style={{ height: "100%", width: "100%" }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className={`relative z-10 flex flex-col lg:flex-row h-full w-full max-w-[1100px] mx-auto ${
                  isMobile
                    ? "items-stretch gap-6 p-6"
                    : "items-center gap-8 lg:gap-16 p-6 sm:p-10 lg:p-16"
                }`}
              >
                <div className="flex-1 flex flex-col justify-center space-y-3 w-full">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-none tracking-[-0.03em]">
                    Thanh Toán
                  </h2>

                  {/* Voucher Info Section */}
                  {selectedVoucher && (
                    <div className="mt-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {selectedVoucher.type === "cash" ? (
                            <Gift className="w-12 h-12 text-white" />
                          ) : (
                            <Sparkles className="w-12 h-12 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                            {selectedVoucher.name}
                          </h3>
                          <p className="text-sm text-white/80 mb-2">
                            {selectedVoucher.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-white">
                              {formatPrice(selectedVoucher.price)}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                selectedVoucher.type === "cash"
                                  ? "bg-green-500 text-white"
                                  : "bg-orange-500 text-white"
                              }`}
                            >
                              {selectedVoucher.type === "cash"
                                ? "Cash"
                                : "Service"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 sm:space-y-6 pt-4">
                    {selectedVoucher ? (
                      <>
                        <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-300" />
                            Dịch vụ đi kèm
                          </h3>
                          <ul className="space-y-2 text-sm">
                            {selectedVoucher.services.map((service, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-white/90"
                              >
                                <Check className="w-4 h-4 text-green-300 mt-1 flex-shrink-0" />
                                <span>{service}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                            Quyền lợi nhận được
                          </h3>
                          <ul className="space-y-2 text-sm">
                            {selectedVoucher.benefits.map((benefit, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-white/90"
                              >
                                <span className="w-2 h-2 rounded-full bg-yellow-300 mt-2 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-3 sm:gap-4">
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm sm:text-base text-white leading-[150%]">
                              Vui lòng chọn một voucher để xem chi tiết dịch vụ
                              và quyền lợi đi kèm.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 sm:gap-4">
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm sm:text-base text-white leading-[150%]">
                              Thông tin sản phẩm sẽ xuất hiện tại đây ngay sau
                              khi bạn chọn voucher mong muốn.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-white/20">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-14 h-14 rounded-full border-2 bg-blue flex justify-center items-center">
                      <Image
                        src="/logo.png"
                        alt="Sarah Chen"
                        width={48}
                        height={48}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                      </div>
                      <div>
                        <p className="text-base sm:text-lg lg:text-xl text-white">
                          Face Wash Fox
                        </p>
                        <p className="text-sm sm:text-base text-white/70">
                          Rửa Mặt Cùng Cáo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  {formData && (
                    <div className="space-y-4 sm:space-y-6 pt-4">
                      <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                          Thông tin người gửi
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-white/70 min-w-[100px]">
                              Họ tên:
                            </span>
                            <span className="text-white font-medium">
                              {formData.senderName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/70 min-w-[100px]">
                              SĐT:
                            </span>
                            <span className="text-white font-medium">
                              {formData.senderPhone}
                            </span>
                          </div>
                          {formData.senderEmail && (
                            <div className="flex items-center gap-2">
                              <span className="text-white/70 min-w-[100px]">
                                Email:
                              </span>
                              <span className="text-white font-medium">
                                {formData.senderEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment QR Code and Account Info */}
                      <div className="mt-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 text-center">
                          Phương thức thanh toán
                        </h3>
                        <div className="flex flex-col items-center gap-4">
                          {/* Payment method selection */}
                          <div className="w-full space-y-4">
                            <div className="space-y-2">
                              <p className="text-sm text-white/80 font-semibold">
                                Bước 1: Chọn nguồn tiền
                              </p>
                              <div className="grid grid-cols sm:grid-cols-1 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentProvider("momo");
                                    setPaymentMethod("momo-wallet");
                                    setMomoQrValue(null);
                                    setMomoDeeplinkUrl(null);
                                    setCurrentOrderId(null);
                                    setIsPaymentReady(false);
                                  }}
                                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                    paymentProvider === "momo"
                                      ? "border-white bg-white text-[#a50064]"
                                      : "border-white/20 bg-white/5 text-white"
                                  }`}
                                >
                                  <Image
                                    src={momoLogoCircle}
                                    alt="MoMo"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-lg"
                                  />
                                  <div>
                                    <p className="font-semibold text-base">
                                     Ví MoMo
                                    </p>
                                    <p className="text-xs opacity-80">
                                      Áp dụng toàn bộ ngân hàng và ví điện tử
                                    </p>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* QR Code from MoMo */}
                          {paymentMethod === "momo-wallet" && (
                            <div className="w-full text-left">
                              <p className="text-sm text-white/80 font-semibold">
                                Bước 2: Nhấn nút &quot;Thanh toán&quot; để tiếp
                                tục
                              </p>
                            </div>
                          )}
                          {paymentMethod === "momo-wallet" ? (
                            isPaymentReady ? (
                              momoQrValue && qrLogoDataUrl ? (
                                <div className=""></div>
                              ) : (
                                <div className="">
                                  {qrLogoDataUrl ? (
                                    <div className="" />
                                  ) : (
                                    <p className=""></p>
                                  )}
                                </div>
                              )
                            ) : (
                              ""
                            )
                          ) : (
                            <div className="p-4 rounded-xl border border-dashed border-white/40 text-center text-white/80 text-sm w-full">
                              Vui lòng chọn nguồn tiền để tiếp tục.
                            </div>
                          )}

                          {paymentProvider === "momo" &&
                            paymentMethod === "momo-wallet" && (
                              <div className="w-full space-y-2">
                                <button
                                  type="button"
                                  onClick={() => setIsPaymentReady(true)}
                                  disabled={
                                    isPaymentReady ||
                                    !selectedVoucher ||
                                    selectedVoucher.price === 0
                                  }
                                  className={`w-full px-6 py-3 rounded-full font-semibold shadow-lg transition-colors ${
                                    isPaymentReady
                                      ? "bg-white/30 text-white/80 cursor-not-allowed"
                                      : "bg-white text-[#B43403] hover:bg-white/90"
                                  }`}
                                >
                                  {isPaymentReady
                                    ? "Đang thực hiện..."
                                    : "Thanh toán"}
                                </button>
                                {!isPaymentReady && (
                                  <p className="text-xs text-white/70 text-center"></p>
                                )}
                              </div>
                            )}

                          {/* Account Information */}
                          <div className="w-full space-y-2 text-sm">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-white font-semibold"></div>
                                </div>
                                {currentOrderId && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/70">
                                      Mã đơn hàng:
                                    </span>
                                    <span className="text-white font-semibold font-mono text-xs">
                                      {currentOrderId}
                                    </span>
                                  </div>
                                )}
                                {selectedVoucher && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-white/70">
                                      Số tiền:
                                    </span>
                                    <span className="text-white font-semibold">
                                      {formatPrice(selectedVoucher.price)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                className={`absolute z-20 flex h-10 w-10 items-center justify-center text-white transition-colors rounded-full ${
                  isMobile
                    ? "right-4 top-4 bg-white/10"
                    : "right-6 top-6 hover:bg-white/10"
                }`}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
