export const metadata = {
  title: "Chính sách bảo mật thanh toán | Face Wash Fox",
  description:
    "Cam kết bảo mật giao dịch thanh toán của Face Wash Fox với khách hàng.",
};

export default function PaymentSecurityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-12">
      <div className="container mx-auto max-w-4xl px-4 text-black">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Chính sách bảo mật thanh toán
          </h1>
          <p className="mt-3 text-gray-600">
            Chúng tôi coi việc bảo mật thông tin thanh toán là ưu tiên hàng đầu.
          </p>
        </header>

        <div className="space-y-8 rounded-3xl bg-white p-6 shadow-xl md:p-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Mã hóa giao dịch
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              Tất cả thông tin thanh toán được mã hóa bằng giao thức HTTPS và TLS 1.3.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Không lưu trữ dữ liệu thẻ
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              Chúng tôi không lưu bất kỳ thông tin số thẻ, CVV, ngày hết hạn nào trên hệ thống. Việc xử lý được thực hiện trực tiếp bởi đối tác thanh toán.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Đối tác thanh toán
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              MoMo, VNPAY, ZaloPay – đều đạt chuẩn PCI DSS và được Ngân hàng Nhà nước cấp phép hoạt động.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          
        </div>
      </div>
    </main>
  );
}

