"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import GreetingCard from "@/app/components/greeting-card";

interface OrderStatus {
  orderId: string;
  status: "PENDING" | "PAID" | "FAILED";
  transId?: string;
  updatedAt?: string;
  message: string;
}

interface FormData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  message: string;
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGreetingCard, setShowGreetingCard] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);

  const checkOrderStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch(`/api/payment/check-status?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderStatus(data);
        setIsLoading(false);

        // Stop polling if payment is completed (PAID or FAILED)
        if (data.status === "PAID" || data.status === "FAILED") {
          // Clear interval after a delay to allow final status check
          setTimeout(() => {
            // Interval will be cleared in useEffect cleanup
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error checking order status:", error);
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    checkOrderStatus();

    const interval = setInterval(() => {
      checkOrderStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, checkOrderStatus]);

  // Load formData from sessionStorage or API when component mounts
  useEffect(() => {
    const loadFormData = async () => {
      if (typeof window !== "undefined") {
        // Ưu tiên 1: Lấy từ sessionStorage (nhanh nhất)
        const stored = sessionStorage.getItem("formData");
        if (stored) {
          try {
            const data: FormData = JSON.parse(stored);
            setFormData(data);
            console.log("✅ Loaded formData from sessionStorage");
          } catch (e) {
            console.error("Error parsing form data from sessionStorage:", e);
          }
        }
        
        const storedService = sessionStorage.getItem("paidServiceName");
        if (storedService) {
          setServiceName(storedService);
        }

        // Ưu tiên 2: Nếu không có trong sessionStorage và có orderId, lấy từ API
        if (!stored && orderId) {
          try {
            console.log("🔄 Loading formData from API for orderId:", orderId);
            const response = await fetch(`/api/payment/get-order?orderId=${orderId}`);
            if (response.ok) {
              const orderData = await response.json();
              if (orderData.formData) {
                setFormData(orderData.formData);
                // Lưu vào sessionStorage để lần sau không cần gọi API
                sessionStorage.setItem("formData", JSON.stringify(orderData.formData));
                console.log("✅ Loaded formData from API and saved to sessionStorage");
              }
              if (orderData.serviceName) {
                setServiceName(orderData.serviceName);
                sessionStorage.setItem("paidServiceName", orderData.serviceName);
              }
            }
          } catch (error) {
            console.error("Error loading formData from API:", error);
          }
        }
      }
    };

    loadFormData();
  }, [orderId]);

  const getStatusDisplay = () => {
    if (isLoading || !orderStatus) {
      return {
        icon: (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
        ),
        title: "Đang kiểm tra trạng thái...",
        description: "Vui lòng chờ trong giây lát để hệ thống xác nhận giao dịch MoMo của bạn.",
        color: "text-orange-600",
      };
    }

    if (orderStatus.status === "PAID") {
      return {
        icon: (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        ),
        title: "Thanh toán thành công!",
        description: "Giao dịch của bạn đã được xác nhận thành công. Bạn có thể tiếp tục chọn dịch vụ hoặc gửi thiệp ngay.",
        color: "text-green-600",
      };
    }

    if (orderStatus.status === "FAILED") {
      return {
        icon: (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        ),
        title: "Thanh toán thất bại",
        description: orderStatus.message || "Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ 0889 866 666 để hỗ trợ.",
        color: "text-red-600",
      };
    }

    return {
      icon: (
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ),
      title: "Đang chờ xác nhận",
      description: "Giao dịch của bạn đang được xử lý. Vui lòng đợi trong giây lát...",
      color: "text-yellow-600",
    };
  };

  const statusDisplay = getStatusDisplay();

  // Show greeting card if requested
  if (showGreetingCard && formData) {
    return (
      <GreetingCard
        formData={formData}
        serviceName={serviceName ?? undefined}
        onBack={() => setShowGreetingCard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="shadow-lg backdrop-blur-sm rounded-lg bg-[#feeedd] p-8 text-center space-y-6">
          <div>
            {statusDisplay.icon}
            <h1 className={`text-3xl font-bold ${statusDisplay.color} mb-3`}>
              {statusDisplay.title}
            </h1>
            <p className="text-gray-700">
              {statusDisplay.description}
            </p>
            {orderId && (
              <div className="mt-4 p-3 bg-white/50 rounded-lg text-left max-w-md mx-auto">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Mã đơn hàng:</span> {orderId}
                </p>
                {orderStatus?.transId && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Mã giao dịch:</span> {orderStatus.transId}
                  </p>
                )}
                {orderStatus?.updatedAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold">Cập nhật lúc:</span>{" "}
                    {new Date(orderStatus.updatedAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
            )}
          </div>

          {orderStatus?.status === "PAID" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/voucher"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center"
              >
                Tiếp tục chọn dịch vụ
              </Link>
              <button
                onClick={() => {
                  // Kiểm tra formData trong sessionStorage trước khi hiển thị greeting card
                  if (typeof window !== "undefined") {
                    const storedFormData = sessionStorage.getItem("formData");
                    if (storedFormData) {
                      try {
                        const data: FormData = JSON.parse(storedFormData);
                        setFormData(data);
                        setShowGreetingCard(true);
                      } catch (e) {
                        console.error("Error parsing form data:", e);
                        alert("Vui lòng điền thông tin thiệp chúc mừng trước.");
                      }
                    } else {
                      alert("Vui lòng điền thông tin thiệp chúc mừng trước.");
                    }
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Gửi thiệp chúc mừng
              </button>
            </div>
          )}

          {orderStatus?.status === "FAILED" && (
            <div className="grid gap-4 sm:grid-cols-2">
               <button
                onClick={() => {
                  // Get the last selected voucher from sessionStorage
                  const lastVoucher = sessionStorage.getItem("lastSelectedVoucher");
                  if (lastVoucher) {
                    try {
                      const voucher = JSON.parse(lastVoucher);
                      // Navigate back to voucher page with auto-open payment popup
                      router.push(`/voucher?openPayment=true&voucherId=${voucher.id}`);
                    } catch (e) {
                      console.error("Error parsing last voucher:", e);
                      router.push("/voucher");
                    }
                  } else {
                    // Fallback to voucher page
                    router.push("/voucher");
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center"
              >
                Quay lại trang thanh toán
              </button>
              <Link
                href="/voucher"
                className="px-6 py-3 bg-white border-2 border-orange-300 text-orange-600 font-semibold rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          )}

          {orderStatus?.status === "PENDING" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={checkOrderStatus}
                className="px-6 py-3 bg-white border-2 border-orange-300 text-orange-600 font-semibold rounded-full shadow-lg transform transition hover:scale-105"
              >
                Làm mới trạng thái
              </button>
              <Link
                href="/voucher"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105 flex items-center justify-center"
              >
                Tiếp tục chọn dịch vụ
              </Link>
            </div>
          )}

        

          <p className="text-xs text-gray-500">
            {orderStatus?.status === "PENDING"
              ? "Hệ thống đang tự động kiểm tra trạng thái. Nếu đã thanh toán, trạng thái sẽ cập nhật trong 1-2 phút."
              : "Nếu cần hỗ trợ, vui lòng liên hệ hotline 0889 866 666 "}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải trạng thái...</p>
          </div>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}

