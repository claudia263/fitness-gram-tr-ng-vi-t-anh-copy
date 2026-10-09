// Chuyển giá trị giữa dạng lưu trên Supabase, dạng hiển thị và dạng ô nhập trong form.
const pad = (n) => String(n).padStart(2, "0");

export function formatDate(v) {
  if (!v) return "";
  const [y, m, d] = String(v).slice(0, 10).split("-");
  return d ? `${d}/${m}/${y}` : String(v);
}

export function formatDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const optionLabel = (col, v) => col.options?.find((o) => String(o.value) === String(v))?.label ?? String(v);

// Giá trị hiển thị trong bảng / file Excel
export function display(col, v, refs) {
  if (v == null || v === "") return "";
  switch (col.type) {
    case "date":
      return formatDate(v);
    case "datetime":
      return formatDateTime(v);
    case "time":
      return String(v).slice(0, 5);
    case "enum":
      return optionLabel(col, v);
    case "multi":
      return (v || []).map((x) => optionLabel(col, x)).join(", ");
    case "tags":
      return (v || []).join(", ");
    case "json":
      return JSON.stringify(v);
    case "bool":
      return v ? "Có" : "Không";
    case "ref":
      return refs?.[col.ref]?.[String(v)] || String(v);
    default:
      return String(v);
  }
}

// Giá trị ban đầu của ô nhập
export function toInput(col, v) {
  if (col.type === "multi") return v || [];
  if (v == null) return "";
  switch (col.type) {
    case "tags":
      return (v || []).join(", ");
    case "json":
      return JSON.stringify(v, null, 2);
    case "time":
      return String(v).slice(0, 5);
    case "date":
      return String(v).slice(0, 10);
    case "bool":
      return v ? "true" : "false";
    default:
      return String(v);
  }
}

// Ô nhập → giá trị gửi lên Supabase. Ném lỗi kèm thông báo nếu không hợp lệ.
export function fromInput(col, raw) {
  if (col.type === "multi") return raw?.length ? raw : col.required ? fail(col, "chọn ít nhất một mục") : [];
  const s = typeof raw === "string" ? raw.trim() : raw;
  if (s === "" || s == null) {
    if (col.required) fail(col, "không được để trống");
    return col.type === "tags" ? [] : null;
  }
  switch (col.type) {
    case "number": {
      const n = Number(String(s).replace(",", "."));
      if (isNaN(n)) fail(col, "phải là số");
      return n;
    }
    case "int": {
      const n = Number(s);
      if (!Number.isInteger(n)) fail(col, "phải là số nguyên");
      return n;
    }
    case "enum":
      return col.numeric ? Number(s) : s;
    case "tags":
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    case "json":
      try {
        return JSON.parse(s);
      } catch (e) {
        return fail(col, "không đúng định dạng JSON");
      }
    case "bool":
      return s === "true";
    default:
      return col.lowercase ? s.toLowerCase() : s;
  }
}

function fail(col, msg) {
  throw new Error(`${col.label}: ${msg}`);
}
