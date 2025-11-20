"use client";

import { useState } from "react";
import { X, Check, Gift, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MoMoPaymentButton from "./momo-payment-button";

export interface VoucherOption {
  id: string;
  name: string;
  price: number;
  type: "service" | "cash";
  description: string;
  services: string[];
  benefits: string[];
  image?: string;
}

interface VoucherSelectionProps {
  isMobile?: boolean;
  onVoucherSelect?: (voucher: VoucherOption | null) => void;
}

export default function VoucherSelection({ isMobile = false, onVoucherSelect }: VoucherSelectionProps) {
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [detailVoucher, setDetailVoucher] = useState<VoucherOption | null>(null);

  const voucherOptions: VoucherOption[] = [
    {
      id: "service-basic",
      name: "Dịch vụ Cộng thêm",
      price: 299000,
      type: "service",
      description: "Voucher dịch vụ chăm sóc da chuyên nghiệp lên đến",
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
      type: "cash",
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
      type: "cash",
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
  ];

  const formatPrice = (price: number) => {
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
        className={`grid ${
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
        } gap-6 mt-8`}
      >
        {voucherOptions.map((voucher) => (
          <motion.div
            key={voucher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div
              className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all hover:scale-105 ${
                selectedVoucherId === voucher.id
                  ? "ring-4 ring-orange-400 shadow-xl"
                  : ""
              }`}
              onClick={() => handleCardClick(voucher)}
            >
              {/* Badge */}
              <div
                className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold z-10 ${
                  voucher.type === "cash"
                    ? "bg-green-500 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                {voucher.type === "cash" ? "💰 Cash" : "✨ Service"}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  {voucher.type === "cash" ? (
                    <Gift className="w-12 h-12 text-orange-500" />
                  ) : (
                    <Sparkles className="w-12 h-12 text-orange-500" />
                  )}
                </div>

                <h3
                  className={`${
                    isMobile ? "text-xl" : "text-2xl"
                  } font-bold text-gray-800 mb-2 text-center`}
                >
                  {voucher.name}
                </h3>

                <p className="text-gray-600 text-sm mb-4 text-center min-h-[40px]">
                  {voucher.description}
                </p>

                <div className="text-center mb-4">
                  <span
                    className={`${
                      isMobile ? "text-2xl" : "text-3xl"
                    } font-bold text-[#eb3526]`}
                  >
                    {formatPrice(voucher.price)}
                  </span>
                </div>

                <button
                  className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(voucher);
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
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
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Thanh toán để nhận voucher
                    </p>
                  </div>
                  <MoMoPaymentButton
                    orderId={`ORDER_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`}
                    amount={detailVoucher.price}
                    className="w-full"
                    onError={(error) => {
                      alert(`Lỗi thanh toán: ${error.message}`);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

