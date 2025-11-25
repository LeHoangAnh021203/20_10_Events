import Link from "next/link";

export const metadata = {
  title: "Chính sách giao nhận | Face Wash Fox",
  description: "Quy định về hình thức giao nhận voucher điện tử của Face Wash Fox.",
};

export default function DeliveryPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-12">
      <div className="container mx-auto max-w-4xl px-4 text-black">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Chính sách giao nhận
          </h1>
          <p className="mt-3 text-gray-600">
            Tất cả voucher được giao dưới dạng điện tử để đảm bảo nhanh chóng và tiện lợi.
          </p>
        </header>

        <div className="space-y-8 rounded-3xl bg-white p-6 shadow-xl md:p-10">
          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Hình thức giao nhận
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
              <li>Voucher được gửi hoàn toàn dưới dạng điện tử qua email đăng ký.</li>
              <li>Thời gian giao: ngay lập tức sau khi thanh toán thành công (tối đa 60 giây).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Kiểm tra email
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              Khách hàng vui lòng kiểm tra cả hộp thư đến và thư rác (spam/junk). Nếu không nhận được voucher trong vòng 5 phút, hãy liên hệ hỗ trợ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Đặt lịch sử dụng dịch vụ
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              Sau khi nhận voucher, khách hàng đặt lịch trực tiếp tại cửa hàng Face Wash Fox gần nhất hoặc qua hotline{" "}
              <a href="tel:0889866666" className="font-semibold text-orange-600">
                08898 66666
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Địa chỉ cửa hàng
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              Danh sách chi nhánh được cập nhật tại{" "}
              <Link href="https://cuahang.facewashfox.com/" className="font-semibold text-orange-600" target="_blank">
                https://cuahang.facewashfox.com/
              </Link>
              .
            </p>
          </section>
        </div>

        
      </div>
    </main>
  );
}

