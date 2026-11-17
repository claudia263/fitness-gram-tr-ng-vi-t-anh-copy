import { SCHOOL, SCHOOLS } from "@/lib/school";

// Chủ hệ thống (admin) chuyển qua lại giữa các trường. Dùng liên kết thường (tải lại trang)
// vì trường được xác định theo đường dẫn khi mở trang.
export default function SchoolSwitch() {
  const items = [
    { id: "vietanh", label: "Việt Anh", href: "/admin" },
    { id: "mgis", label: "MGIS", href: `${SCHOOLS.mgis.basename}/admin` },
  ];
  return (
    <div className="inline-flex gap-0.5 rounded-xl bg-[#F4F5F8] p-0.5" role="group" aria-label="Chuyển trường">
      {items.map((it) => {
        const active = it.id === SCHOOL.id;
        return (
          <a
            key={it.id}
            href={it.href}
            aria-current={active ? "true" : undefined}
            title={SCHOOLS[it.id].name}
            className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold transition ${active ? "bg-navy text-white" : "text-navy hover:bg-white"}`}
          >
            {it.label}
          </a>
        );
      })}
    </div>
  );
}
