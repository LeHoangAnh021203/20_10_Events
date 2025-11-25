"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import GreetingCard from "@/app/components/greeting-card";

interface FormData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  message: string;
}

function PaymentResult() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [hasSynced, setHasSynced] = useState(false);
  const [showGreetingCard, setShowGreetingCard] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [serviceName, setServiceName] = useState<string | null>(null);

  useEffect(() => {
    const resultCode = searchParams.get("resultCode");
    let orderId = searchParams.get("orderId");
    const message = searchParams.get("message");

    // Nếu không có orderId trong URL, thử lấy từ sessionStorage
    if (!orderId && typeof window !== "undefined") {
      // Lấy orderId từ sessionStorage (có thể được lưu trước khi redirect)
      const storedOrderId = sessionStorage.getItem("currentOrderId");
      if (storedOrderId) {
        orderId = storedOrderId;
        console.log("📦 Retrieved orderId from sessionStorage:", orderId);
      }
    }

    // Tự động sync data khi có orderId và thanh toán thành công
    const syncOrderData = async () => {
      if (orderId && resultCode === "0" && !hasSynced) {
        try {
          console.log("🔄 Auto-syncing order data to Google Sheets:", orderId);
          // Gọi API check-status để trigger sync (API này sẽ tự động sync nếu chưa sync)
          const response = await fetch(`/api/payment/check-status?orderId=${orderId}`);
          if (response.ok) {
            const data = await response.json();
            console.log("✅ Order status checked and synced:", data);
            setHasSynced(true);
          } else {
            console.error("❌ Failed to check order status:", response.status);
            // Retry sau 2 giây nếu lần đầu thất bại
            setTimeout(async () => {
              try {
                const retryResponse = await fetch(`/api/payment/check-status?orderId=${orderId}`);
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  console.log("✅ Order synced on retry:", retryData);
                  setHasSynced(true);
                }
              } catch (retryError) {
                console.error("❌ Retry sync failed:", retryError);
              }
            }, 2000);
          }
        } catch (error) {
          console.error("❌ Error syncing order data:", error);
          // Retry sau 2 giây
          setTimeout(async () => {
            try {
              const retryResponse = await fetch(`/api/payment/check-status?orderId=${orderId}`);
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log("✅ Order synced on retry:", retryData);
                setHasSynced(true);
              }
            } catch (retryError) {
              console.error("❌ Retry sync failed:", retryError);
            }
          }, 2000);
        }
      }
    };

    if (resultCode === "0") {
      setStatus("success");
      console.log("Thanh toán thành công:", { orderId, message });
      // Sync data ngay khi thanh toán thành công
      syncOrderData();
    } else {
      setStatus("failed");
      console.log("Thanh toán thất bại:", { orderId, resultCode, message });
    }
  }, [searchParams, hasSynced]);

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
        let orderId = searchParams.get("orderId");
        if (!orderId) {
          orderId = sessionStorage.getItem("currentOrderId");
        }
        
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
  }, [searchParams]);

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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="shadow-lg backdrop-blur-sm rounded-lg bg-[#feeedd] p-8 text-center">
          {status === "success" ? (
            <>
              <div className="mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-green-500"
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
                <h1 className="text-3xl font-bold text-green-600 mb-2">
                  Thanh toán thành công!
                </h1>
                <p className="text-gray-600 mb-4">
                  Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xử lý.
                </p>
                {searchParams.get("orderId") && (
                  <p className="text-sm text-gray-500">
                    Mã đơn hàng: {searchParams.get("orderId")}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105"
                >
                  Quay lại trang thanh toán
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-white border-2 border-orange-300 text-orange-600 font-semibold rounded-full shadow-lg transform transition hover:scale-105"
                >
                  In hóa đơn
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-red-500"
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
                <h1 className="text-3xl font-bold text-red-600 mb-2">
                  Thanh toán thất bại
                </h1>
                <p className="text-gray-600 mb-4">
                  {searchParams.get("message") || "Đã xảy ra lỗi trong quá trình thanh toán."}
                </p>
                {searchParams.get("orderId") && (
                  <p className="text-sm text-gray-500">
                    Mã đơn hàng: {searchParams.get("orderId")}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105"
                >
                  Quay lại trang thanh toán
                </button>
                <Link
                  href="/voucher"
                  className="px-6 py-3 bg-white border-2 border-orange-300 text-orange-600 font-semibold rounded-full shadow-lg transform transition hover:scale-105"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      }
    >
      <PaymentResult />
    </Suspense>
  );
}

