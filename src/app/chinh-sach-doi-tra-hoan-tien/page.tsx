

export const metadata = {
  title: "Chính sách đổi trả – hoàn tiền | Face Wash Fox",
  description:
    "Thông tin về các trường hợp được hoàn tiền và quy trình xử lý tại Face Wash Fox.",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-12">
      <div className="container mx-auto max-w-4xl px-4 text-black">
          <header className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Chính sách đổi trả – hoàn tiền
            </h1>
            <p className="mt-3 text-gray-600">
              Áp dụng cho các đơn hàng mua voucher tại Face Wash Fox.
            </p>
          </header>

          <div className="space-y-8 rounded-3xl bg-white p-6 shadow-xl md:p-10">
            <section>
              <h2 className="text-2xl font-semibold text-[#eb3526]">
                Trường hợp được hoàn tiền 100%
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
                <li>Lỗi kỹ thuật từ hệ thống khiến khách hàng không nhận được voucher trong vòng 07 ngày làm việc.</li>
                <li>Thanh toán trùng (double payment) do lỗi hệ thống.</li>
                <li>Sự kiện/dịch vụ bị hủy hoàn toàn từ phía Face Wash Fox.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#eb3526]">
                Quy trình yêu cầu hoàn tiền
              </h2>
              <p className="mt-3 leading-relaxed text-gray-700">
                Gửi email về <a href="mailto:info@facewashfox.com" className="font-semibold text-orange-600">info@facewashfox.com</a> kèm các thông tin:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
                <li>Mã đơn hàng.</li>
                <li>Họ tên, số điện thoại.</li>
                <li>Ảnh chụp màn hình giao dịch.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#eb3526]">
                Thời gian xử lý hoàn tiền
              </h2>
              <p className="mt-3 leading-relaxed text-gray-700">
                07-14 ngày làm việc kể từ khi nhận đủ thông tin hợp lệ. Hoàn tiền về đúng tài khoản/ví đã thanh toán.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#eb3526]">
                Trường hợp không áp dụng hoàn tiền
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
                <li>Voucher đã được sử dụng (toàn bộ hoặc một phần).</li>
                <li>Quá thời hạn sử dụng voucher.</li>
                <li>Khách hàng tự ý hủy mà không thuộc các trường hợp đủ điều kiện hoàn tiền.</li>
              </ul>
            </section>
          </div>

          
      </div>
    </main>
  );
}

