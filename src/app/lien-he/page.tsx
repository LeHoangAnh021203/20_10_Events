import Link from "next/link";

export const metadata = {
  title: "Liên hệ | Face Wash Fox",
  description: "Kết nối với đội ngũ chăm sóc khách hàng của Face Wash Fox.",
};

const contactInfo: Array<
  | { label: string; value: string; type?: "text" }
  | { label: string; value: string; type: "phone"; display?: string }
  | { label: string; value: string; type: "email" }
  | { label: string; value: string; type: "link"; display?: string }
> = [
  { label: "Công ty", value: "Công ty Cổ phần FB Network", type: "text" },
  { label: "Mã số doanh nghiệp", value: "0316806815", type: "text" },
  {
    label: "Địa chỉ",
    value:
      "Lầu 2, Số 2 Song Hành, Phường Bình Trưng, TP. Thủ Đức, TP. Hồ Chí Minh",
    type: "text",
  },
  {
    label: "Hotline chăm sóc khách hàng",
    value: "0889866666",
    display: "08898 66666",
    type: "phone",
  },
  { label: "Email", value: "info@facewashfox.com", type: "email" },
  { label: "Website", value: "https://event.facewashfox.com", type: "link" },
  {
    label: "Giờ làm việc",
    value: "09h30 – 17h30 (từ thứ 2 đến thứ 6, trừ lễ/Tết)",
    type: "text",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 py-12">
      <div className="container mx-auto max-w-4xl px-4 text-black">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Liên hệ với Face Wash Fox
          </h1>
          <p className="mt-3 text-gray-600">
            Đội ngũ Face Wash Fox luôn sẵn sàng hỗ trợ bạn trong suốt quá trình
            đặt mua và sử dụng voucher.
          </p>
        </header>

        <div className="rounded-3xl bg-white p-6 shadow-xl md:p-10 space-y-6">
          {contactInfo.map((item) => {
            if (item.type === "link") {
              return (
                <div
                  key={item.label}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <span className="font-semibold text-gray-800">
                    {item.label}
                  </span>
                  <Link
                    href={item.value}
                    target="_blank"
                    className="text-orange-600 underline"
                  >
                    {"display" in item && item.display
                      ? item.display
                      : item.value}
                  </Link>
                </div>
              );
            }
            if (item.type === "email") {
              return (
                <div
                  key={item.label}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <span className="font-semibold text-gray-800">
                    {item.label}
                  </span>
                  <a
                    href={`mailto:${item.value}`}
                    className="text-orange-600 underline"
                  >
                    {item.value}
                  </a>
                </div>
              );
            }
            if (item.type === "phone") {
              return (
                <div
                  key={item.label}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <span className="font-semibold text-gray-800">
                    {item.label}
                  </span>
                  <a
                    href={`tel:${item.value}`}
                    className="text-orange-600 font-semibold"
                  >
                    {"display" in item && item.display
                      ? item.display
                      : item.value}
                  </a>
                </div>
              );
            }
            return (
              <div
                key={item.label}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <span className="font-semibold text-gray-800">
                  {item.label}
                </span>
                <span className="text-gray-700">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
