"use client";

import { useEffect, useState, Suspense, useRef } from "react";
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
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(null);
  const syncAttemptedRef = useRef(false); // Prevent duplicate syncs

  useEffect(() => {
    const resultCode = searchParams.get("resultCode");
    let orderId = searchParams.get("orderId");
    const message = searchParams.get("message");
    const showCard = searchParams.get("showCard"); // New parameter to force show greeting card

    // Nếu không có orderId trong URL, thử lấy từ storage (sessionStorage -> localStorage)
    if (!orderId && typeof window !== "undefined") {
      const readOrderId = () => {
        try {
          const sessionOrderId = sessionStorage.getItem("currentOrderId");
          if (sessionOrderId) return sessionOrderId;
        } catch {}
        try {
          return localStorage.getItem("currentOrderId");
        } catch {}
        return null;
      };

      const storedOrderId = readOrderId();
      if (storedOrderId) {
        orderId = storedOrderId;
        console.log("📦 Retrieved orderId from storage:", orderId);
      }
    }
    setResolvedOrderId(orderId ?? null);

    // Nếu có showCard=1, tự động load formData và hiển thị greeting card
    if (showCard === "1" && orderId) {
      setStatus("success"); // Set success để có thể load formData
      return; // Skip resultCode check
    }

    if (resultCode === "0") {
      setStatus("success");
      console.log("Thanh toán thành công:", { orderId, message });
    } else if (resultCode !== null) {
      // Chỉ set failed nếu có resultCode và không phải "0"
      setStatus("failed");
      console.log("Thanh toán thất bại:", { orderId, resultCode, message });
    } else if (orderId) {
      // Nếu có orderId nhưng không có resultCode (từ email link), set success và load data
      setStatus("success");
      console.log("Loading order from email link:", { orderId });
    } else {
      // Nếu không có gì, giữ loading
      setStatus("loading");
    }
  }, [searchParams]);

  useEffect(() => {
    const syncWithSessionData = async () => {
      if (status !== "success" || !resolvedOrderId || hasSynced) {
        return;
      }
      if (syncAttemptedRef.current) {
        return;
      }

      let latestFormData = formData;
      let latestServiceName = serviceName;

      // Bước 1: Thử lấy từ state (đã load từ useEffect khác)
      // Bước 2: Thử lấy từ sessionStorage (có thể bị xóa trên mobile)
      // Bước 2b: Thử lấy từ localStorage (backup cho mobile)
      // Bước 2c: Thử lấy từ pendingOrderPayload (đã lưu toàn bộ thông tin trước khi redirect)
      let pendingPayload: {
        orderId: string;
        amount: number;
        serviceName?: string;
        formData?: FormData;
        createdAt?: number;
      } | null = null;

      if (typeof window !== "undefined") {
        const readStorageValue = (key: string) => {
          try {
            const sessionValue = sessionStorage.getItem(key);
            if (sessionValue) return sessionValue;
          } catch {}
          try {
            return localStorage.getItem(key);
          } catch {}
          return null;
        };

        const pendingPayloadRaw =
          readStorageValue("pendingOrderPayload") ||
          localStorage.getItem("pendingOrderPayload");
        if (pendingPayloadRaw) {
          try {
            pendingPayload = JSON.parse(pendingPayloadRaw);
          } catch (error) {
            console.warn("Không thể parse pendingOrderPayload:", error);
          }
        }

        if (!latestFormData) {
          // Ưu tiên sessionStorage
          const stored = readStorageValue("formData");
          if (stored) {
            try {
              latestFormData = JSON.parse(stored);
              setFormData(latestFormData);
              console.log("✅ Loaded formData from storage");
            } catch (error) {
              console.error("Không thể parse formData từ storage:", error);
            }
          }
        }

        if (!latestServiceName) {
          const storedService = readStorageValue("paidServiceName");
          if (storedService) {
            latestServiceName = storedService;
            setServiceName(latestServiceName);
          }
        }

        // Nếu vẫn chưa có dữ liệu, thử lấy từ pendingOrderPayload
        if (pendingPayload) {
          if (
            (!resolvedOrderId || resolvedOrderId === pendingPayload.orderId) &&
            pendingPayload.orderId
          ) {
            if (!latestFormData && pendingPayload.formData) {
              latestFormData = pendingPayload.formData;
              setFormData(pendingPayload.formData);
              console.log("✅ Loaded formData từ pendingOrderPayload");
            }
            if (!latestServiceName && pendingPayload.serviceName) {
              latestServiceName = pendingPayload.serviceName;
              setServiceName(pendingPayload.serviceName);
            }
          }
        }
      }

      // Bước 3: Nếu vẫn không có formData, lấy từ API (quan trọng cho mobile)
      if (!latestFormData && resolvedOrderId) {
        try {
          console.log("🔄 Loading formData from API (fallback):", resolvedOrderId);
          const orderResponse = await fetch(`/api/payment/get-order?orderId=${resolvedOrderId}`);
          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            if (orderData.formData) {
              latestFormData = orderData.formData;
              setFormData(orderData.formData);
              // Lưu vào localStorage để lần sau không cần gọi API
              try {
                localStorage.setItem("formData", JSON.stringify(orderData.formData));
                console.log("✅ Loaded formData from API and saved to localStorage");
              } catch (storageError) {
                console.warn("Could not save to localStorage:", storageError);
              }
            }
            if (orderData.serviceName && !latestServiceName) {
              latestServiceName = orderData.serviceName;
              setServiceName(orderData.serviceName);
              try {
                localStorage.setItem("paidServiceName", orderData.serviceName);
              } catch (storageError) {
                console.warn("Could not save serviceName to localStorage:", storageError);
              }
            }
          } else {
            console.warn("⚠️ Could not load order from API:", orderResponse.status);
          }
        } catch (error) {
          console.error("Error loading formData from API:", error);
        }
      }

      let lastVoucherRaw: string | null = null;
      if (typeof window !== "undefined") {
        try {
          lastVoucherRaw = sessionStorage.getItem("lastSelectedVoucher");
          if (!lastVoucherRaw) {
            lastVoucherRaw = localStorage.getItem("lastSelectedVoucher");
          }
        } catch {}
      }
      let voucherPrice: number | undefined;
      if (lastVoucherRaw) {
        try {
          const voucher = JSON.parse(lastVoucherRaw);
          if (typeof voucher.price === "number") {
            voucherPrice = voucher.price;
          }
          if (!latestServiceName && voucher.name) {
            latestServiceName = voucher.name;
          }
        } catch (error) {
          console.warn("Không thể parse voucher cuối:", error);
        }
      }

      // Nếu vẫn chưa có giá trị, thử lấy từ pendingOrderPayload
      if ((!voucherPrice || Number.isNaN(voucherPrice)) && pendingPayload) {
        if (
          (!resolvedOrderId || pendingPayload.orderId === resolvedOrderId) &&
          typeof pendingPayload.amount === "number"
        ) {
          voucherPrice = pendingPayload.amount;
        }
      }

      const amountParam = Number(searchParams.get("amount"));
      const amount = !Number.isNaN(amountParam)
        ? amountParam
        : voucherPrice ?? 0;
      const transId = searchParams.get("transId") || undefined;
      const message = searchParams.get("message") || undefined;

      const clearStorage = () => {
        if (typeof window === "undefined") return;
        // CHỈ xóa sessionStorage, GIỮ LẠI localStorage để backup cho mobile
        // localStorage sẽ được xóa khi user hoàn tất (sau khi chia sẻ thiệp)
        ["formData", "paidServiceName", "pendingOrderPayload"].forEach((key) => {
          try {
            sessionStorage.removeItem(key);
          } catch {}
          // KHÔNG xóa localStorage ở đây - cần cho greeting card
        });
      };

      // Nếu vẫn không có formData, đợi cho tới khi load xong
      if (!latestFormData) {
        console.warn(
          "⚠️ sync-client: formData chưa sẵn sàng, đợi load từ storage/API:",
          resolvedOrderId
        );
        return;
      }

      syncAttemptedRef.current = true; // Đánh dấu chỉ sau khi đã có dữ liệu để sync

      try {
        // Chỉ sync nếu có formData (quan trọng để có thông tin khách hàng)
        if (latestFormData) {
          console.log("🔄 Syncing order with formData:", resolvedOrderId);
          const response = await fetch("/api/payment/sync-client", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: resolvedOrderId,
              amount,
              serviceName: latestServiceName ?? undefined,
              formData: latestFormData,
              transId,
              message,
              status: "PAID",
            }),
          });

          if (response.ok) {
            try {
              const responseData = await response.json();
              // Nếu đã sync rồi (alreadySynced: true), vẫn coi như thành công
              if (responseData.success || responseData.alreadySynced) {
                console.log("✅ Order synced successfully");
                setHasSynced(true);
                clearStorage();
                return;
              } else {
                console.warn("⚠️ Sync response OK but success=false:", responseData);
              }
            } catch (parseError) {
              console.error("❌ Failed to parse sync response:", parseError);
            }
          } else {
            // Response không OK, thử đọc error message
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorText = await response.text();
              if (errorText) {
                try {
                  const errorJson = JSON.parse(errorText);
                  errorMessage = errorJson.error || errorJson.message || errorText;
                } catch {
                  errorMessage = errorText || errorMessage;
                }
              }
            } catch (readError) {
              console.warn("Could not read error response:", readError);
            }
            console.error("❌ Failed to sync via sync-client:", errorMessage);
          }
        } else {
          console.warn("⚠️ No formData available, cannot sync customer info for order:", resolvedOrderId);
          // Vẫn thử check-status để sync payment info (nhưng không có customer info)
          // Điều này tốt hơn là không sync gì cả
        }

        // Fallback: Nếu không có formData hoặc sync-client thất bại, thử check-status
        // check-status sẽ query MoMo và sync nếu cần (nhưng có thể không có formData)
        console.log(
          "ℹ️ Falling back to check-status sync for order:",
          resolvedOrderId
        );
        const fallbackResponse = await fetch(
          `/api/payment/check-status?orderId=${resolvedOrderId}`
        );
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log("✅ Order status checked:", fallbackData.status);
          // Chỉ đánh dấu đã sync nếu thực sự đã sync (có formData hoặc đã có trong DB)
          if (latestFormData || fallbackData.status === "PAID") {
            setHasSynced(true);
            clearStorage();
          }
        } else {
          console.error(
            "❌ Fallback check-status failed:",
            fallbackResponse.status
          );
        }
      } catch (error) {
        console.error("❌ Error syncing order data:", error);
      }
    };

    syncWithSessionData();
  }, [status, resolvedOrderId, formData, serviceName, hasSynced, searchParams]);

  // Load formData from sessionStorage or API when component mounts
  // Also auto-show greeting card if coming from email link
  useEffect(() => {
    const loadFormData = async () => {
      const showCard = searchParams.get("showCard");
      if (typeof window !== "undefined" && resolvedOrderId) {
        const readStorage = (key: string) => {
          try {
            const sessionValue = sessionStorage.getItem(key);
            if (sessionValue) return sessionValue;
          } catch {}
          try {
            return localStorage.getItem(key);
          } catch {}
          return null;
        };

        // Ưu tiên 1: Lấy từ sessionStorage (nhanh nhất)
        let stored = readStorage("formData");
        // Nếu không có trong sessionStorage, thử localStorage (backup cho mobile)
        if (!stored) {
          try {
            stored = localStorage.getItem("formData");
          } catch {}
        }
        
        if (stored) {
          try {
            const data: FormData = JSON.parse(stored);
            setFormData(data);
            console.log("✅ Loaded formData from storage");
          } catch (e) {
            console.error("Error parsing form data from storage:", e);
          }
        }
        
        let storedService = readStorage("paidServiceName");
        if (!storedService) {
          try {
            storedService = localStorage.getItem("paidServiceName");
          } catch {}
        }
        if (storedService) {
          setServiceName(storedService);
        }

        // Ưu tiên 2: Nếu không có trong storage (thường xảy ra trên mobile),
        // lấy từ API ngay lập tức để đảm bảo có formData khi sync
        if (!stored && resolvedOrderId) {
          try {
            console.log("🔄 Loading formData from API (mobile/fallback):", resolvedOrderId);
            const response = await fetch(`/api/payment/get-order?orderId=${resolvedOrderId}`);
            if (response.ok) {
              const orderData = await response.json();
              if (orderData.formData) {
                setFormData(orderData.formData);
                // Lưu vào cả sessionStorage và localStorage (backup cho mobile)
                try {
                  sessionStorage.setItem("formData", JSON.stringify(orderData.formData));
                  localStorage.setItem("formData", JSON.stringify(orderData.formData));
                  console.log("✅ Loaded formData from API and saved to storage");
                } catch (storageError) {
                  console.warn("Could not save to storage:", storageError);
                  console.log("✅ Loaded formData from API (could not save to storage)");
                }
              }
              if (orderData.serviceName) {
                setServiceName(orderData.serviceName);
                try {
                  sessionStorage.setItem("paidServiceName", orderData.serviceName);
                  localStorage.setItem("paidServiceName", orderData.serviceName);
                } catch (storageError) {
                  console.warn("Could not save serviceName to storage:", storageError);
                }
              }

              // Auto-show greeting card if coming from email link
              if (showCard === "1" && orderData.formData) {
                setShowGreetingCard(true);
                console.log("✅ Auto-showing greeting card from email link");
              }
            } else {
              console.warn("⚠️ Could not load order from API:", response.status);
            }
          } catch (error) {
            console.error("Error loading formData from API:", error);
          }
        }
      }
    };

    loadFormData();
  }, [searchParams, resolvedOrderId]);

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
        <div className="shadow-lg backdrop-blur-sm rounded-lg bg-[#f5efe6] p-8 text-center">
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
                {resolvedOrderId && (
                  <p className="text-sm text-gray-500">
                    Mã đơn hàng: {resolvedOrderId}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={async () => {
                    // Ưu tiên sử dụng formData từ state (đã được load từ API nếu cần)
                    let dataToUse = formData;
                    
                    // Nếu state chưa có, thử lấy từ storage (sessionStorage hoặc localStorage)
                    if (!dataToUse && typeof window !== "undefined") {
                      let storedFormData = sessionStorage.getItem("formData");
                      if (!storedFormData) {
                        storedFormData = localStorage.getItem("formData");
                      }
                      if (storedFormData) {
                        try {
                          dataToUse = JSON.parse(storedFormData);
                          setFormData(dataToUse);
                        } catch (e) {
                          console.error("Error parsing form data from storage:", e);
                        }
                      }
                    }
                    
                    // Nếu vẫn không có, thử load từ API (quan trọng cho mobile)
                    if (!dataToUse && resolvedOrderId) {
                      try {
                        console.log("🔄 Loading formData from API for greeting card:", resolvedOrderId);
                        const response = await fetch(`/api/payment/get-order?orderId=${resolvedOrderId}`);
                        if (response.ok) {
                          const orderData = await response.json();
                          if (orderData.formData) {
                            dataToUse = orderData.formData;
                            setFormData(dataToUse);
                            console.log("✅ Loaded formData from API for greeting card");
                          }
                        }
                      } catch (error) {
                        console.error("Error loading formData from API:", error);
                      }
                    }
                    
                    // Hiển thị greeting card nếu có formData
                    if (dataToUse) {
                      setShowGreetingCard(true);
                    } else {
                      alert("Không thể tải thông tin thiệp chúc mừng. Vui lòng thử lại sau.");
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
                {resolvedOrderId && (
                  <p className="text-sm text-gray-500">
                    Mã đơn hàng: {resolvedOrderId}
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

