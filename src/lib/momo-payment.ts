/**
 * Utility functions for MoMo payment integration
 */

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
}

export interface CreatePaymentResponse {
  partnerCode?: string;
  orderId?: string;
  requestId?: string;
  amount?: number;
  responseTime?: number;
  message?: string;
  resultCode?: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  deeplinkWebInApp?: string;
}

/**
 * Create a MoMo payment request
 * @param params - Payment parameters (orderId, amount)
 * @returns Payment response with redirect URL
 */
export async function createMoMoPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResponse> {
  const response = await fetch("/api/payment/create-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Không thể tạo thanh toán MoMo");
  }

  return response.json();
}

/**
 * Redirect to MoMo payment page
 * @param payUrl - Payment URL from MoMo API
 */
export function redirectToMoMo(payUrl: string) {
  if (typeof window !== "undefined" && payUrl) {
    window.location.href = payUrl;
  }
}

/**
 * Complete payment flow: create payment and redirect
 * @param params - Payment parameters
 */
export async function initiateMoMoPayment(params: CreatePaymentParams) {
  try {
    const paymentData = await createMoMoPayment(params);
    
    if (paymentData.resultCode === 0 && paymentData.payUrl) {
      redirectToMoMo(paymentData.payUrl);
    } else {
      throw new Error(
        paymentData.message || "Không thể tạo thanh toán MoMo"
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    throw error;
  }
}

