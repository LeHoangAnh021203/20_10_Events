

export const metadata = {
  title: "Chính sách thanh toán | Face Wash Fox",
  description:
    "Thông tin về phương thức thanh toán và thời gian xử lý đơn hàng tại Face Wash Fox.",
};

export default function PaymentPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-12">
      <div className="container mx-auto max-w-4xl px-4 text-black">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Chính sách thanh toán
          </h1>
          <p className="mt-3 text-gray-600">
            Quy định về phương thức thanh toán và bảo mật giao dịch tại
            Face Wash Fox.
          </p>
        </header>

        <div className="space-y-8 rounded-3xl bg-white p-6 shadow-xl md:p-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Các phương thức thanh toán được chấp nhận
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
              <li>Thẻ ATM nội địa / Internet Banking.</li>
              <li>Thẻ tín dụng, thẻ ghi nợ quốc tế (Visa, MasterCard, JCB).</li>
              <li>Ví điện tử Momo, ZaloPay, ShopeePay.</li>
              <li>Thanh toán qua cổng VNPAY QR.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Bảo mật thanh toán
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
              <li>Toàn bộ giao dịch được mã hóa bằng chuẩn SSL/TLS 256-bit.</li>
              <li>Chúng tôi không lưu trữ thông tin thẻ ngân hàng của khách hàng.</li>
              <li>Đối tác thanh toán đều đạt chuẩn PCI DSS Level 1.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Thời gian xử lý
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
              <li>Thanh toán thành công → hệ thống tự động gửi voucher trong vòng 60 giây.</li>
              <li>Trường hợp lỗi kỹ thuật, chúng tôi sẽ hoàn tiền trong vòng 03–07 ngày làm việc.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Chứng từ điện tử
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              Hóa đơn điện tử (nếu có) sẽ được gửi qua email theo yêu cầu của khách hàng.
            </p>
          </section>
        </div>

        
      </div>
    </main>
  );
}

