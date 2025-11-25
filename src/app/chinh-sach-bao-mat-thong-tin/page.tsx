

export const metadata = {
  title: "Chính sách bảo mật thông tin | Face Wash Fox",
  description:
    "Cam kết bảo mật thông tin cá nhân của khách hàng tại Face Wash Fox.",
};

const items = [
  {
    title: "Thông tin chúng tôi thu thập",
    list: ["Họ tên, số điện thoại, email.", "Lịch sử giao dịch.", "Dữ liệu cookie (nếu khách hàng đồng ý)."],
  },
  {
    title: "Mục đích sử dụng",
    list: [
      "Xử lý đơn hàng, gửi voucher.",
      "Chăm sóc khách hàng, thông báo khuyến mãi (chỉ khi có sự đồng ý).",
    ],
  },
  {
    title: "Cam kết bảo mật",
    list: [
      "Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.",
      "Chỉ chia sẻ thông tin với bên thứ ba khi có sự đồng ý của khách hàng hoặc theo yêu cầu pháp luật.",
    ],
  },
  {
    title: "Quyền của khách hàng",
    list: [
      "Yêu cầu truy cập, chỉnh sửa, xóa dữ liệu cá nhân bất kỳ lúc nào.",
      "Rút lại sự đồng ý nhận email marketing.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-12">
      <div className="container mx-auto max-w-4xl px-4 text-black">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-orange-500">
            Có hiệu lực từ 25/11/2025
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Chính sách bảo mật thông tin cá nhân
          </h1>
        </header>

        <div className="space-y-8 rounded-3xl bg-white p-6 shadow-xl md:p-10">
          {items.map((item) => (
            <section key={item.title}>
              <h2 className="text-2xl font-semibold text-[#eb3526]">{item.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
                {item.list.map((content) => (
                  <li key={content}>{content}</li>
                ))}
              </ul>
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-semibold text-[#eb3526]">
              Liên hệ thực hiện quyền
            </h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              Email: <a href="mailto:info@facewashfox.com" className="font-semibold text-orange-600">info@facewashfox.com</a>
            </p>
          </section>
        </div>

        
      </div>
    </main>
  );
}

