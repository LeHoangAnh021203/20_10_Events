

export const metadata = {
  title: "Điều khoản giao dịch | Face Wash Fox",
  description:
    "Điều khoản giao dịch chung áp dụng cho khách hàng mua voucher tại Face Wash Fox.",
};

const sections = [
  {
    title: "Định nghĩa",
    content: [
      `"Chúng tôi", "FB Network", "Face Wash Fox": Công ty Cổ phần FB Network (Mã số thuế: 0316806815).`,
      `"Khách hàng", "Bạn": Cá nhân từ 15 tuổi trở lên hoặc tổ chức thực hiện mua voucher trên website https://event.facewashfox.com.`,
      `"Voucher": Phiếu dịch vụ điện tử được gửi qua email để sử dụng tại hệ thống Face Wash Fox.`,
    ],
  },
  {
    title: "Chấp nhận điều khoản",
    content: [
      `Việc nhấn nút "Thanh toán" đồng nghĩa với việc Khách hàng đã đọc, hiểu và chấp nhận toàn bộ Điều khoản giao dịch này.`,
    ],
  },
  {
    title: "Quy trình đặt hàng",
    list: [
      "Bước 1: Chọn gói dịch vụ.",
      "Bước 2: Điền thông tin khách hàng và người nhận.",
      "Bước 3: Chọn phương thức thanh toán.",
      "Bước 4: Nhận email xác nhận kèm mã voucher.",
    ],
  },
  {
    title: "Giá cả và thanh toán",
    content: [
      "Giá niêm yết đã bao gồm 8% VAT (nếu có).",
      "Chúng tôi có quyền thay đổi giá bất kỳ lúc nào nhưng cam kết áp dụng đúng giá tại thời điểm Khách hàng hoàn tất thanh toán.",
    ],
  },
  {
    title: "Hiệu lực và sử dụng voucher",
    content: [
      "Thời hạn sử dụng voucher được ghi rõ trên từng chương trình (thường 30–90 ngày).",
      "Voucher không quy đổi thành tiền mặt và không hoàn lại nếu đã kích hoạt.",
    ],
  },
  {
    title: "Trách nhiệm pháp lý",
    content: [
      "Chúng tôi không chịu trách nhiệm trong trường hợp bất khả kháng (thiên tai, chiến tranh, sự cố hệ thống ngân hàng, tấn công mạng…).",
    ],
  },
  {
    title: "Giải quyết tranh chấp",
    content: [
      "Mọi tranh chấp sẽ được giải quyết thông qua thương lượng.",
      "Nếu không đạt được thỏa thuận, tranh chấp sẽ được chuyển tới Tòa án nhân dân có thẩm quyền tại TP. Hồ Chí Minh.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-12">
      <div className="container mx-auto max-w-4xl px-4 text-black">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-orange-500">
            Có hiệu lực từ 25/11/2025
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Điều khoản giao dịch chung
          </h1>
          <p className="mt-3 text-gray-600">
            Áp dụng cho toàn bộ giao dịch mua voucher tại hệ thống Face Wash Fox.
          </p>
        </header>

        <div className="space-y-8 rounded-3xl bg-white p-6 shadow-xl md:p-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold text-[#eb3526]">
                {section.title}
              </h2>
              {section.content &&
                section.content.map((paragraph) => (
                  <p key={paragraph} className="mt-3 leading-relaxed text-gray-700">
                    {paragraph}
                  </p>
                ))}
              {section.list && (
                <ul className="mt-3 list-disc space-y-2 pl-6 text-gray-700">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

       
      </div>
    </main>
  );
}

