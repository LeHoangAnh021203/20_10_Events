"use client";

import { useState } from "react";
import { initiateMoMoPayment } from "@/lib/momo-payment";

interface MoMoPaymentButtonProps {
  orderId: string;
  amount: number;
  disabled?: boolean;
  className?: string;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

/**
 * Component nút thanh toán MoMo
 * 
 * @example
 * <MoMoPaymentButton
 *   orderId="ORDER_123"
 *   amount={100000}
 *   onError={(error) => console.error(error)}
 * />
 */
export default function MoMoPaymentButton({
  orderId,
  amount,
  disabled = false,
  className = "",
  onError,
  onSuccess,
}: MoMoPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await initiateMoMoPayment({ orderId, amount });
      onSuccess?.();
    } catch (error) {
      console.error("Payment error:", error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={`
        flex items-center justify-center gap-2
        bg-gradient-to-r from-pink-500 to-pink-600
        hover:from-pink-600 hover:to-pink-700
        disabled:opacity-60 disabled:cursor-not-allowed
        text-white font-semibold rounded-lg
        shadow-lg transform transition
        hover:scale-105 active:scale-95
        px-6 py-3
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Thanh toán MoMo</span>
        </>
      )}
    </button>
  );
}

