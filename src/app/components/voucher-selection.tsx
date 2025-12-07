"use client";

import { useState, useRef, useEffect, type MouseEvent } from "react";
import { X, Check, Gift, Sparkles } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export interface VoucherOption {
  id: string;
  name: string;
  price: number;
  type: "service" | "cash";
  description: string;
  services: string[];
  benefits: string[];
  image?: string;
  features?: string[];
}

interface VoucherSelectionProps {
  isMobile?: boolean;
  onVoucherSelect?: (voucher: VoucherOption | null) => void;
}

export default function VoucherSelection({
  isMobile = false,
  onVoucherSelect,
}: VoucherSelectionProps) {
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(
    null
  );
  const [detailVoucher, setDetailVoucher] = useState<VoucherOption | null>(
    null
  );
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const serviceVideoSrc = "/To_video__202512011638.mp4";
  const cash200kVideoSrc = "/To_video_ngn_202512051030.mp4";
  const cash500kVideoSrc = "/To_video_ngn_202512051038.mp4";
  const serviceVideoRef = useRef<HTMLVideoElement | null>(null);
  const cash200kVideoRef = useRef<HTMLVideoElement | null>(null);
  const cash500kVideoRef = useRef<HTMLVideoElement | null>(null);
  const SERVICE_VIDEO_PLAYBACK_RATE = 3.1;

  useEffect(() => {
    if (serviceVideoRef.current) {
      serviceVideoRef.current.playbackRate = SERVICE_VIDEO_PLAYBACK_RATE;
    }
    if (cash200kVideoRef.current) {
      cash200kVideoRef.current.playbackRate = SERVICE_VIDEO_PLAYBACK_RATE;
    }
    if (cash500kVideoRef.current) {
      cash500kVideoRef.current.playbackRate = SERVICE_VIDEO_PLAYBACK_RATE;
    }
  }, [hoveredCardId]);

  const theme = {
    background:
      "linear-gradient(180deg, #FFECD9 0%, #FFC9A1 45%, #F8985E 100%)",
    badgeBg: "rgba(248, 152, 94, 0.25)",
    badgeBorder: "rgba(248, 152, 94, 0.45)",
    chipBorder: "rgba(248, 152, 94, 0.6)",
    buttonBg: "#F57C3A",
    buttonFg: "#ffffff",
  };

  const cardSizeClass = isMobile ? "min-h-[520px]" : "aspect-[4/5]";
  const mediaHeightClass = isMobile ? "h-48" : "h-1/2";

  const voucherOptions: VoucherOption[] = [
    {
      id: "service-basic",
      name: "Dịch vụ Cộng thêm",
      price: 0,
      type: "service",
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
      features: ["dịch vụ"],
    },

    // {
    //   id: "cash-200k",
    //   name: "Cash Voucher 200.000đ",
    //   price: 200000,
    //   type: "cash",
    //   description: "Voucher tiền mặt trị giá 200.000 VNĐ",
    //   services: [
    //     "Sử dụng cho mọi dịch vụ tại Face Wash Fox",
    //     "Áp dụng cho tất cả sản phẩm",
    //     "Có thể kết hợp với các chương trình khuyến mãi khác",
    //   ],
    //   benefits: [
    //     "Linh hoạt trong việc sử dụng",
    //     "Không giới hạn thời gian sử dụng",
    //     "Có thể tặng cho người thân",
    //     "Áp dụng tại tất cả chi nhánh",
    //   ],
    //   features: ["tiền mặt"],
    // },
    // {
    //   id: "cash-500k",
    //   name: "Cash Voucher 500.000đ",
    //   price: 500000,
    //   type: "cash",
    //   description: "Voucher tiền mặt trị giá 500.000 VNĐ",
    //   services: [
    //     "Sử dụng cho mọi dịch vụ tại Face Wash Fox",
    //     "Áp dụng cho tất cả sản phẩm",
    //     "Có thể kết hợp với các chương trình khuyến mãi khác",
    //     "Ưu tiên đặt lịch dịch vụ cao cấp",
    //   ],
    //   benefits: [
    //     "Linh hoạt trong việc sử dụng",
    //     "Không giới hạn thời gian sử dụng",
    //     "Có thể tặng cho người thân",
    //     "Áp dụng tại tất cả chi nhánh",
    //     "Được tư vấn chăm sóc da miễn phí",
    //   ],
    //   features: ["tiền mặt"],
    // },
  ];

  const getVoucherMedia = (voucher: VoucherOption) => {
    switch (voucher.id) {
      case "service-basic":
        return {
          image: "/Custom for web - Voucher DVCT-01.png",
          overlayText: "",
        };
      case "cash-200k":
        return {
          image: "/Cashvoucher200.png",
          overlayText: "",
        };
      case "cash-500k":
      case "test-2k":
      default:
        return {
          image: "/Cashvoucher500.png",
          overlayText: "",
        };
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

  const handleCardClick = (voucher: VoucherOption) => {
    // Chỉ đánh dấu được chọn (hiệu ứng), không mở popup
    setSelectedVoucherId(voucher.id);
    // Truyền voucher được chọn lên component cha
    onVoucherSelect?.(voucher);
  };

  const handleViewDetail = (voucher: VoucherOption) => {
    // Mở popup chi tiết
    setDetailVoucher(voucher);
  };

  const handleCloseDetail = () => {
    setDetailVoucher(null);
  };

  return (
    <>
      {/* Voucher Cards Grid */}
      <div
  className={`
    mt-8 grid gap-6 px-4 max-w-6xl mx-auto
    ${
      isMobile
        ? "grid-cols-1"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    }
  `}
>
        {voucherOptions.map((voucher) => (
          <motion.div
            key={voucher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center w-full"

          >
            {(() => {
              const isSelected = selectedVoucherId === voucher.id;
              const isHovered = hoveredCardId === voucher.id;
              const media = getVoucherMedia(voucher);
              return (
                <div
                  className={`relative flex w-full max-w-sm sm:max-w-md ${cardSizeClass} overflow-hidden rounded-[24px] sm:rounded-[32px] border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.25)] sm:shadow-[0_25px_70px_rgba(0,0,0,0.25)] transition-all duration-500 hover:shadow-orange-300 ${
                    isSelected ? "ring-4 ring-[#F57C3A]" : ""
                  } hover:scale-[1.01] cursor-pointer`}
                  style={{ backgroundImage: theme.background }}
                  onClick={() => handleCardClick(voucher)}
                  onMouseEnter={() => setHoveredCardId(voucher.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <div className="flex h-full flex-col w-full">
                    {/* Media area */}
                    <div
                      className={`relative w-full ${mediaHeightClass} overflow-hidden rounded-[24px] bg-black`}
                    >
                      <Image
                        src={media.image}
                        alt={voucher.name}
                        fill
                        className={`object-cover object-center transition-transform duration-[1200ms] ease-out ${
                          isHovered ? "scale-110" : "scale-100"
                        }`}
                        priority={voucher.price === 0}
                      />
                      {voucher.id === "service-basic" && (
                        <video
                          ref={serviceVideoRef}
                          src={serviceVideoSrc}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                            isHovered ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      )}
                      {voucher.id === "cash-200k" && (
                        <video
                          ref={cash200kVideoRef}
                          src={cash200kVideoSrc}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                            isHovered ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      )}
                      {voucher.id === "cash-500k" && (
                        <video
                          ref={cash500kVideoRef}
                          src={cash500kVideoSrc}
                          muted
                          loop
                          playsInline
                          autoPlay
                          preload="metadata"
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                            isHovered ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-500 ${
                          isHovered ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <div className="absolute bottom-4 left-4 right-4 text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                          {media.overlayText}
                        </div>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 flex flex-col justify-between gap-4 p-5 sm:p-6">
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-tight drop-shadow leading-snug">
                          {voucher.name}
                        </h3>
                      </div>

                      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-bold text-white">
                            {formatPrice(voucher.price)}
                          </span>
                          {voucher.price > 0 && (
                            <span className="text-xs sm:text-sm text-white/50 line-through">
                              {formatPrice(voucher.price + 50000)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-start sm:justify-end max-w-full sm:max-w-[45%]">
                          {(voucher.features ?? voucher.services)
                            .slice(0, 2)
                            .map((feature) => (
                              <span
                                key={feature}
                                className="px-2 py-1 text-[11px] sm:text-xs font-medium text-white rounded-md"
                                style={{
                                  backgroundColor: "rgba(0,0,0,0.12)",
                                  border: `1px solid ${theme.chipBorder}`,
                                }}
                              >
                                {feature}
                              </span>
                            ))}
                        </div>
                      </div>

                      <div className="flex gap-3 flex-col sm:flex-row">
                        <button
                          className="flex-1 font-semibold rounded-full py-3 px-4 transition-all shadow-lg shadow-black/20 text-base sm:text-lg"
                          style={{
                            backgroundColor: theme.buttonBg,
                            color: theme.buttonFg,
                          }}
                          onClick={(event: MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            handleCardClick(voucher);
                          }}
                        >
                          {isSelected ? "Đã chọn" : "Chọn "}
                        </button>
                        <button
                          className="flex-1 border border-white/40 hover:bg-white/15 bg-transparent rounded-full py-3 px-4 text-white transition-colors text-base sm:text-lg"
                          onClick={(event: MouseEvent<HTMLButtonElement>) => {
                            event.stopPropagation();
                            handleViewDetail(voucher);
                          }}
                        >
                          Điều khoản
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailVoucher && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={handleCloseDetail}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {detailVoucher.price === 0 ? (
                // Free voucher: Show image
                <div className="relative max-w-4xl w-full max-h-[95vh] flex items-center justify-center">
                  <button
                    onClick={handleCloseDetail}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full transition-colors z-10 shadow-lg"
                  >
                    <X className="w-5 h-5 text-gray-800" />
                  </button>
                  <div className="relative w-full h-full">
                    <Image
                      src="/Screenshot 2025-12-02 at 10.29.03.png"
                      alt="Điều khoản áp dụng - Face Wash Fox"
                      width={1200}
                      height={1600}
                      className="w-full h-auto rounded-lg shadow-2xl"
                      priority
                    />
                  </div>
                </div>
              ) : (
                // Paid vouchers: Show detailed content
                <div
                  className={`bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative ${
                    isMobile ? "p-4" : "p-8"
                  }`}
                >
                  {/* Close Button */}
                  <button
                    onClick={handleCloseDetail}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                      {detailVoucher.type === "cash" ? (
                        <Gift className="w-16 h-16 text-orange-500" />
                      ) : (
                        <Sparkles className="w-16 h-16 text-orange-500" />
                      )}
                    </div>
                    <h2
                      className={`${
                        isMobile ? "text-2xl" : "text-3xl"
                      } font-bold text-gray-800 mb-2`}
                    >
                      {detailVoucher.name}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {detailVoucher.description}
                    </p>
                    <div className="text-center">
                      <span
                        className={`${
                          isMobile ? "text-3xl" : "text-4xl"
                        } font-bold text-[#eb3526]`}
                      >
                        {formatPrice(detailVoucher.price)}
                      </span>
                    </div>
                  </div>

                  {/* Services Included */}
                  <div className="mb-6">
                    <h3
                      className={`${
                        isMobile ? "text-lg" : "text-xl"
                      } font-semibold text-gray-800 mb-4 flex items-center gap-2`}
                    >
                      <Check className="w-5 h-5 text-green-500" />
                      Dịch vụ đi kèm
                    </h3>
                    <ul className="space-y-2">
                      {detailVoucher.services.map((service, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="mb-6">
                    <h3
                      className={`${
                        isMobile ? "text-lg" : "text-xl"
                      } font-semibold text-gray-800 mb-4 flex items-center gap-2`}
                    >
                      <Gift className="w-5 h-5 text-orange-500" />
                      Những gì bạn sẽ nhận được
                    </h3>
                    <ul className="space-y-2">
                      {detailVoucher.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment Button */}
                  <div className="">
                    <div className="text-center ">
                      <p className="text-sm text-gray-600 mb-2">
                        Thanh toán để nhận voucher
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
