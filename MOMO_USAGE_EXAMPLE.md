# Ví dụ sử dụng thanh toán MoMo

## Cách 1: Sử dụng Component có sẵn

```tsx
import MoMoPaymentButton from "@/app/components/momo-payment-button";

export default function CheckoutPage() {
  const orderId = `ORDER_${Date.now()}`;
  const amount = 100000; // 100,000 VND

  return (
    <div>
      <h1>Thanh toán</h1>
      <MoMoPaymentButton
        orderId={orderId}
        amount={amount}
        onError={(error) => {
          alert(`Lỗi: ${error.message}`);
        }}
        onSuccess={() => {
          console.log("Đang chuyển hướng đến MoMo...");
        }}
      />
    </div>
  );
}
```

## Cách 2: Sử dụng Utility Function trực tiếp

```tsx
"use client";

import { useState } from "react";
import { initiateMoMoPayment } from "@/lib/momo-payment";

export default function CustomPaymentPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const amount = 100000;
      
      await initiateMoMoPayment({ orderId, amount });
    } catch (error) {
      console.error("Payment error:", error);
      alert(`Lỗi thanh toán: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className="px-6 py-3 bg-pink-500 text-white rounded-lg"
    >
      {isLoading ? "Đang xử lý..." : "Thanh toán MoMo"}
    </button>
  );
}
```

## Cách 3: Tích hợp vào form hiện có

```tsx
"use client";

import { useState } from "react";
import { initiateMoMoPayment } from "@/lib/momo-payment";

export default function FormWithPayment() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    amount: 100000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lưu form data trước khi thanh toán
    // ... your form submission logic
    
    // Tạo order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initiate payment
    try {
      await initiateMoMoPayment({
        orderId,
        amount: formData.amount,
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert("Không thể tạo thanh toán. Vui lòng thử lại.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <button type="submit">Thanh toán MoMo</button>
    </form>
  );
}
```

## Xử lý kết quả thanh toán

Sau khi thanh toán, MoMo sẽ redirect về `/payment/success` với các query params:

- `resultCode`: `0` = thành công, khác `0` = thất bại
- `orderId`: Mã đơn hàng
- `message`: Thông báo từ MoMo

Trang `/payment/success` sẽ tự động hiển thị kết quả dựa trên `resultCode`.

## Lưu ý quan trọng

1. **Order ID phải duy nhất**: Sử dụng timestamp + random string
2. **Amount tính bằng VND**: Ví dụ 100000 = 100,000 VND
3. **IPN Webhook**: MoMo sẽ tự động gọi `/api/payment/momo-ipn` để cập nhật trạng thái
4. **Không dựa vào redirect URL**: Luôn verify qua IPN webhook để đảm bảo an toàn

## Kiểm tra trạng thái đơn hàng

Sau khi thanh toán, bạn có thể kiểm tra trạng thái trong file `data/orders.json`:

```json
{
  "ORDER_1234567890": {
    "status": "PAID",
    "transId": "1234567890",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Tích hợp với Google Sheets (tùy chọn)

Bạn có thể mở rộng IPN handler để lưu vào Google Sheets:

```typescript
// Trong /api/payment/momo-ipn/route.ts
if (resultCode === 0) {
  // Update order status
  await updateOrderStatus(orderId, "PAID", transId);
  
  // Save to Google Sheets
  await fetch(process.env.GOOGLE_SHEETS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      orderId,
      amount,
      "PAID",
      transId,
      new Date().toISOString(),
    ]),
  });
}
```

