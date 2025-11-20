"use client";

import { useState, useEffect } from "react";
import { X, Gift, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GodRays, MeshGradient } from "@paper-design/shaders-react";
import Image from "next/image";
import VoucherSelection, { VoucherOption } from "./voucher-selection";
import { QRCodeSVG } from "qrcode.react";
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

export default function Hero() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherOption | null>(
    null
  );
  const [formData, setFormData] = useState<FormData | null>(null);
  const [momoPayUrl, setMomoPayUrl] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const handleExpand = () => {
    if (selectedVoucher) {
      setIsExpanded(true);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isExpanded]);

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

  useEffect(() => {
    // Generate MoMo payment URL when voucher is selected and form is expanded
    const generateMoMoPayment = async () => {
      if (isExpanded && selectedVoucher) {
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
            }),
          });

          if (response.ok) {
            const data = await response.json();

            if (formData) {
              try {
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
              // Use qrCodeUrl if available, otherwise use payUrl
              if (data.qrCodeUrl) {
                setMomoPayUrl(data.qrCodeUrl);
              } else if (data.payUrl) {
                setMomoPayUrl(data.payUrl);
              }
            }
          }
        } catch (error) {
          console.error("Error creating MoMo payment:", error);
        }
      } else {
        // Reset when closed
        setMomoPayUrl(null);
        setCurrentOrderId(null);
      }
    };

    generateMoMoPayment();
  }, [isExpanded, selectedVoucher, formData]);

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20">
        {/* GodRays Background */}
        <div className="absolute inset-0">
          <GodRays
            colorBack="#00000000"
            colors={["#FFFFFF6E", "#F3F3F3F0", "#8A8A8A", "#989898"]}
            colorBloom="#FFFFFF"
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

        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[90%] tracking-[-0.03em] text-black mix-blend-exclusion max-w-3xl">
            Chọn Dịch Vụ Quà Tặng
          </h1>

          <p className="text-base sm:text-lg md:text-xl leading-[160%] text-black max-w-7xl px-4 mb-8">
            Vui lòng chọn loại quà tặng mà bạn muốn gửi đến người thương. Face
            Wash Fox cung cấp nhiều dịch vụ quà tặng khác nhau, bao gồm gói Dịch
            Vụ Cộng Thêm, Cash Voucher kèm thiệp chúc, thông điệp cá nhân và các
            hình thức chăm sóc đặc biệt. Tùy vào lựa chọn của bạn, hệ thống sẽ
            chuẩn bị nội dung phù hợp và áp dụng các ưu đãi đi kèm. Hãy chọn
            dịch vụ mà bạn mong muốn để tiếp tục.
          </p>

          {/* Voucher Selection Component */}
          <div className="w-full max-w-6xl px-4">
            <VoucherSelection
              isMobile={isMobile}
              onVoucherSelect={setSelectedVoucher}
            />
          </div>
          <AnimatePresence initial={false}>
            {!isExpanded && (
              <motion.div className="inline-block relative">
                <motion.div
                  style={{
                    borderRadius: "100px",
                  }}
                  layout
                  layoutId="cta-card"
                  className="absolute inset-0 bg-[#004FE5] items-center justify-center transform-gpu will-change-transform"
                ></motion.div>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout={false}
                  onClick={handleExpand}
                  disabled={!selectedVoucher}
                  className={`h-15 px-6 sm:px-8 py-3 text-lg sm:text-xl font-regular tracking-[-0.01em] relative ${
                    selectedVoucher
                      ? "text-[#E3E3E3] cursor-pointer"
                      : "text-[#E3E3E3]/50 cursor-not-allowed"
                  }`}
                >
                  Thanh Toán Ngay
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-2">
            <motion.div
              layoutId="cta-card"
              transition={{ duration: 0.3 }}
              style={{
                borderRadius: "24px",
              }}
              layout
              className="relative flex h-full w-full overflow-y-auto bg-[#004FE5] transform-gpu will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                layout={false}
                transition={{ duration: 0.15, delay: 0.05 }}
                className="absolute h-full inset-0 overflow-hidden pointer-events-none"
                style={{
                  borderRadius: "24px",
                }}
              >
                <MeshGradient
                  speed={1}
                  colors={["#2452F1", "#022474", "#163DB9", "#0B1D99"]}
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
                className="relative z-10 flex flex-col lg:flex-row h-full w-full max-w-[1100px] mx-auto items-center p-6 sm:p-10 lg:p-16 gap-8 lg:gap-16"
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
                      <Image
                        src="/logo.png"
                        alt="Sarah Chen"
                        width={48}
                        height={48}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
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
                          Mã QR thanh toán
                        </h3>
                        <div className="flex flex-col items-center gap-4">
                          {/* QR Code from MoMo */}
                          {momoPayUrl ? (
                            <div className="bg-white p-3 rounded-lg">
                              <QRCodeSVG
                                value={momoPayUrl}
                                size={200}
                                level="H"
                                includeMargin
                              />
                            </div>
                          ) : (
                            <div className="bg-white p-3 rounded-lg w-[200px] h-[200px] flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0041C1]"></div>
                            </div>
                          )}

                          {/* Account Information */}
                          <div className="w-full space-y-2 text-sm">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-white/70">
                                    Hình thức thanh toán
                                  </span>
                                  <span className="text-white font-semibold">
                                    MoMo
                                  </span>
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
                            <p className="text-xs text-white/60 text-center mt-3">
                              Quét mã QR bằng ứng dụng MoMo để thanh toán
                              <br />
                              Hoặc bấm vào nút &quot;Thanh toán MoMo&quot; bên
                              dưới để thanh toán trực tiếp
                            </p>

                            <div className="flex justify-center mt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/payment/status${
                                      currentOrderId
                                        ? `?orderId=${currentOrderId}`
                                        : ""
                                    }`
                                  )
                                }
                                className="px-6 py-2 rounded-full bg-white text-[#0041C1] font-semibold hover:bg-white/90 transition-colors text-sm shadow-lg"
                              >
                                Kiểm tra trạng thái thanh toán
                              </button>
                            </div>
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
                className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center text-white bg-transparent transition-colors hover:bg-white/10 rounded-full"
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
