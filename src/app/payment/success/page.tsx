"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function PaymentResult() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    const resultCode = searchParams.get("resultCode");
    const orderId = searchParams.get("orderId");
    const message = searchParams.get("message");

    if (resultCode === "0") {
      setStatus("success");
      console.log("Thanh toán thành công:", { orderId, message });
    } else {
      setStatus("failed");
      console.log("Thanh toán thất bại:", { orderId, resultCode, message });
    }
  }, [searchParams]);

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
                <Link
                  href="/"
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105"
                >
                  Về trang chủ
                </Link>
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
                <Link
                  href="/"
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-full shadow-lg transform transition hover:scale-105"
                >
                  Về trang chủ
                </Link>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-white border-2 border-orange-300 text-orange-600 font-semibold rounded-full shadow-lg transform transition hover:scale-105"
                >
                  Thử lại
                </button>
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

