"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RefundApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
  refundTransId?: string;
  amount?: number;
  [key: string]: unknown;
}

export default function RefundPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [transId, setTransId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: RefundApiResponse;
  } | null>(null);

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/payment/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          transId,
          amount: parseInt(amount, 10),
          description: description || undefined,
        }),
      });

      const data: RefundApiResponse = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message || "Hoàn tiền thành công",
          data,
        });
        // Reset form sau 3 giây
        setTimeout(() => {
          setOrderId("");
          setTransId("");
          setAmount("");
          setDescription("");
          setResult(null);
        }, 3000);
      } else {
        setResult({
          success: false,
          message: data.error || data.message || "Hoàn tiền thất bại",
          data,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Hoàn tiền giao dịch MoMo
            </h1>
            <p className="text-gray-600 text-sm">
              Nhập thông tin đơn hàng để thực hiện hoàn tiền
            </p>
          </div>

          <form onSubmit={handleRefund} className="space-y-4">
            <div>
              <label
                htmlFor="orderId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Order ID (Mã đơn hàng) *
              </label>
              <input
                id="orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                placeholder="ORDER_xxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label
                htmlFor="transId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Transaction ID (Mã giao dịch MoMo) *
              </label>
              <input
                id="transId"
                type="text"
                value={transId}
                onChange={(e) => setTransId(e.target.value)}
                required
                placeholder="2912345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã giao dịch từ giao dịch thanh toán thành công ban đầu
              </p>
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Số tiền hoàn (VND) *
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1000"
                max="50000000"
                placeholder="200000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tối thiểu: 1.000 VND | Tối đa: 50.000.000 VND
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mô tả (tùy chọn)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Lý do hoàn tiền..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-300 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang xử lý..." : "Hoàn tiền"}
            </button>
          </form>

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                result.success
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5"
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
                ) : (
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5"
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
                )}
                <div className="flex-1">
                  <p className="font-semibold">{result.message}</p>
                  {result.data && (
                    <div className="mt-2 text-sm">
                      {result.data.refundTransId && (
                        <p>
                          Mã giao dịch hoàn tiền:{" "}
                          <span className="font-mono">
                            {result.data.refundTransId}
                          </span>
                        </p>
                      )}
                      {result.data.amount && (
                        <p>
                          Số tiền:{" "}
                          {result.data.amount.toLocaleString("vi-VN")} VND
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

