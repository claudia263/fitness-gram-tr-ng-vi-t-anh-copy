// Đọc / ghi các bảng cho trang "Dữ liệu" của admin. Quyền thực tế do RLS trên Supabase quyết định.
import { supabase } from "@/api/base44Client";
import { REFS, pkOf } from "@/lib/adminData/tables";

const fail = (error) => {
  throw Object.assign(new Error(error.message), { code: error.code, status: error.status });
};

// Bỏ ký tự đặc biệt của cú pháp lọc PostgREST
const cleanQ = (q) => String(q || "").replace(/[,()*%\\:"]/g, " ").trim();

function applySort(q, table, sort) {
  const s = sort || table.sort || (table.noCreated ? pkOf(table) : "-created_date");
  const desc = s.startsWith("-");
  return q.order(desc ? s.slice(1) : s, { ascending: !desc, nullsFirst: false });
}

function buildQuery(table, { q, filters, sort }, opts) {
  let query = supabase.from(table.key).select("*", opts);
  const text = cleanQ(q);
  if (text && table.search?.length) query = query.or(table.search.map((c) => `${c}.ilike.%${text}%`).join(","));
  for (const [k, v] of Object.entries(filters || {})) if (v) query = query.eq(k, v);
  return applySort(query, table, sort);
}

export async function fetchPage(table, { q, filters, sort, page = 0, pageSize = 50 }) {
  const { data, error, count } = await buildQuery(table, { q, filters, sort }, { count: "exact" }).range(page * pageSize, page * pageSize + pageSize - 1);
  if (error) fail(error);
  return { rows: data, count: count ?? data.length };
}

export async function fetchAll(table, params, max = 20000) {
  const rows = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await buildQuery(table, params).range(from, from + 999);
    if (error) fail(error);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

// Tên hiển thị cho các cột liên kết: { refTable: { id: label } }
export async function resolveRefs(table, rows) {
  const out = {};
  const byRef = {};
  for (const c of table.columns.filter((c) => c.type === "ref")) {
    const ids = rows.map((r) => r[c.key]).filter((v) => v != null && v !== "");
    const set = (byRef[c.ref] = byRef[c.ref] || new Set());
    ids.forEach((id) => set.add(String(id)));
  }
  await Promise.all(
    Object.entries(byRef).map(async ([ref, set]) => {
      const ids = [...set];
      const map = (out[ref] = {});
      for (let i = 0; i < ids.length; i += 100) {
        const { data, error } = await supabase.from(ref).select(REFS[ref].select).in("id", ids.slice(i, i + 100));
        if (error) continue; // bảng liên kết chưa có / không đọc được → hiện mã
        data.forEach((r) => (map[String(r.id)] = REFS[ref].label(r)));
      }
    })
  );
  return out;
}

export async function searchRef(ref, q) {
  const cfg = REFS[ref];
  let query = supabase.from(ref).select(cfg.select).limit(20);
  const text = cleanQ(q);
  if (text && cfg.search) query = query.or(cfg.search.split(",").map((c) => `${c}.ilike.%${text}%`).join(","));
  const first = cfg.search ? cfg.search.split(",")[0] : "id";
  const { data, error } = await query.order(first);
  if (error) fail(error);
  return data.map((r) => ({ id: String(r.id), label: cfg.label(r) }));
}

export async function insertRow(table, row) {
  const { error } = await supabase.from(table.key).insert(row);
  if (error) fail(error);
}

export async function updateRow(table, pkValue, patch) {
  const { error } = await supabase.from(table.key).update(patch).eq(pkOf(table), pkValue);
  if (error) fail(error);
}

export async function deleteRow(table, row) {
  const pkValue = row[pkOf(table)];
  // Bảng thể lực không có khoá ngoại → tự xoá dữ liệu con (nối bằng student_id) trước
  for (const child of table.cascade || []) {
    const { error } = await supabase.from(child).delete().eq("student_id", pkValue);
    if (error) fail(error);
  }
  const { error } = await supabase.from(table.key).delete().eq(pkOf(table), pkValue);
  if (error) fail(error);
}
