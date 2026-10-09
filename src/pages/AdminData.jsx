// Trang "Dữ liệu" (chỉ admin): xem, tìm, thêm, sửa, xoá và xuất Excel mọi bảng trên Supabase.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Database, Download, Info, Loader2, Plus, Search } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import { PageHeader } from "@/components/clubs/ClubUi";
import RecordDialog from "@/components/adminData/RecordDialog";
import RefPicker from "@/components/adminData/RefPicker";
import { toast } from "@/components/ui/use-toast";
import { GROUPS, TABLES, can, pkOf, tableByKey } from "@/lib/adminData/tables";
import { deleteRow, fetchAll, fetchPage, insertRow, resolveRefs, updateRow } from "@/lib/adminData/api";
import { display } from "@/lib/adminData/format";
import { track, useTrackView } from "@/lib/usage";

const PAGE_SIZE = 50;
const inputCls = "fg-input h-10 w-full bg-white px-3 text-sm text-navy";

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function TableNav({ current, onPick }) {
  return (
    <>
      <label htmlFor="pick-table" className="sr-only">
        Chọn bảng
      </label>
      <select id="pick-table" className={`${inputCls} lg:hidden`} value={current} onChange={(e) => onPick(e.target.value)}>
        {GROUPS.map((g) => (
          <optgroup key={g.key} label={g.label}>
            {TABLES.filter((t) => t.group === g.key).map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <nav aria-label="Các bảng dữ liệu" className="fg-card hidden p-3 lg:block">
        {GROUPS.map((g) => (
          <div key={g.key} className="mb-3 last:mb-0">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{g.label}</p>
            {TABLES.filter((t) => t.group === g.key).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onPick(t.key)}
                aria-current={t.key === current ? "page" : undefined}
                className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${t.key === current ? "bg-navy font-semibold text-white" : "text-navy hover:bg-navy-soft"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}

export default function AdminData() {
  const [params, setParams] = useSearchParams();
  const table = tableByKey[params.get("bang")] || TABLES[0];
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sortBy, setSort] = useState(null);
  const [page, setPage] = useState(0);
  const [filterBy, setFilters] = useState({});
  const [filterLabels, setFilterLabels] = useState({});
  const [editing, setEditing] = useState(null); // null | "new" | row
  const [exporting, setExporting] = useState(false);
  const debounced = useDebounced(q);
  useTrackView("xem_du_lieu", { chiTiet: { bang: table.key } });

  useEffect(() => {
    setQ("");
    setSort(null);
    setPage(0);
    setFilters({});
    setFilterLabels({});
  }, [table.key]);
  useEffect(() => setPage(0), [debounced, filterBy, sortBy]);

  // Ngay sau khi đổi bảng, bỏ qua bộ lọc / sắp xếp còn sót của bảng cũ
  const keys = table.columns.map((c) => c.key);
  const search = table.search?.length ? debounced : "";
  const sort = sortBy && keys.includes(sortBy.replace("-", "")) ? sortBy : null;
  const filters = Object.fromEntries(Object.entries(filterBy).filter(([k, v]) => v && table.filters?.includes(k)));
  const queryKey = ["admin-data", table.key, search, sort, page, filters];
  const data = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetchPage(table, { q: search, filters, sort, page, pageSize: PAGE_SIZE });
      return { ...res, refs: await resolveRefs(table, res.rows) };
    },
    placeholderData: keepPreviousData,
  });
  const rows = data.data?.rows || [];
  const refs = data.data?.refs || {};
  const count = data.data?.count || 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const listCols = useMemo(() => table.columns.filter((c) => c.list), [table]);
  const filterCols = (table.filters || []).map((k) => table.columns.find((c) => c.key === k)).filter(Boolean);
  const currentSort = sort || table.sort || "";

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-data", table.key] });
  const pick = (key) => setParams({ bang: key });
  const toggleSort = (key) => setSort(currentSort === key ? `-${key}` : key);

  const save = async (patch) => {
    if (editing === "new") await insertRow(table, patch);
    else await updateRow(table, editing[pkOf(table)], patch);
    track("sua_du_lieu", { chiTiet: { bang: table.key, thao_tac: editing === "new" ? "them" : "sua" } });
    toast({ title: editing === "new" ? "Đã thêm bản ghi" : "Đã lưu thay đổi" });
    setEditing(null);
    await refresh();
  };
  const remove = async () => {
    await deleteRow(table, editing);
    track("sua_du_lieu", { chiTiet: { bang: table.key, thao_tac: "xoa" } });
    toast({ title: "Đã xoá bản ghi" });
    setEditing(null);
    await refresh();
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const all = await fetchAll(table, { q: search, filters, sort });
      const allRefs = await resolveRefs(table, all);
      const cols = table.columns;
      const sheet = all.map((r) => Object.fromEntries(cols.map((c) => [c.label, display(c, r[c.key], allRefs)])));
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet, { header: cols.map((c) => c.label) }), table.label.slice(0, 31));
      XLSX.writeFile(wb, `${table.key}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      track("xuat_du_lieu", { soLan: all.length, chiTiet: { bang: table.key } });
    } catch (err) {
      toast({ title: "Không xuất được file", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader icon={Database} title="Dữ liệu" subtitle="Xem, thêm, sửa, xoá trực tiếp dữ liệu của app trên Supabase" />

        <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <TableNav current={table.key} onPick={pick} />
          </div>

          <section className="fg-card min-w-0 p-4 sm:p-5" aria-labelledby="table-title">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="table-title" className="text-xl font-extrabold text-navy">
                  {table.label}
                </h2>
                <p className="text-sm text-muted-foreground tabular-nums">{data.isLoading ? "Đang tải…" : `${count.toLocaleString("vi-VN")} bản ghi`}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={exportExcel} disabled={exporting || !count} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-navy ring-1 ring-[rgba(38,39,93,0.12)] hover:bg-navy-soft disabled:opacity-50">
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />} Xuất Excel
                </button>
                {can(table, "Insert") && (
                  <button type="button" onClick={() => setEditing("new")} className="fg-btn-secondary inline-flex h-10 items-center gap-2 px-4 text-sm">
                    <Plus className="h-4 w-4" aria-hidden="true" /> Thêm
                  </button>
                )}
              </div>
            </div>

            {table.note && (
              <p className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2 text-sm text-navy" style={{ background: "#F7F8FC" }}>
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {table.note}
              </p>
            )}

            <div className="mb-4 flex flex-wrap gap-3">
              {table.search?.length > 0 && (
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input aria-label="Tìm kiếm" className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm theo ${table.search.map((k) => table.columns.find((c) => c.key === k)?.label.toLowerCase()).join(", ")}`} />
                </div>
              )}
              {filterCols.map((c) => (
                <RefPicker
                  key={c.key}
                  refKey={c.ref}
                  className="min-w-[200px] flex-1"
                  value={filters[c.key] || null}
                  label={filterLabels[c.key]}
                  placeholder={`Lọc theo ${c.label.toLowerCase()}`}
                  onChange={(v, label) => {
                    setFilters((f) => ({ ...f, [c.key]: v }));
                    setFilterLabels((l) => ({ ...l, [c.key]: label }));
                  }}
                />
              ))}
            </div>

            {data.error ? (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
                Không đọc được bảng này: {data.error.message}. Nếu bảng mới thêm, kiểm tra đã chạy đủ các file trong supabase/migrations chưa.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl ring-1 ring-[rgba(38,39,93,0.08)]">
                <table className="w-full min-w-max text-left text-sm">
                  <thead style={{ background: "#F7F8FC" }}>
                    <tr>
                      {listCols.map((c) => {
                        const active = currentSort.replace("-", "") === c.key;
                        return (
                          <th key={c.key} scope="col" className="px-3 py-2 font-semibold text-navy" aria-sort={active ? (currentSort.startsWith("-") ? "descending" : "ascending") : "none"}>
                            <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 whitespace-nowrap hover:underline">
                              {c.label}
                              {active && (currentSort.startsWith("-") ? <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />)}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className={data.isFetching ? "opacity-60" : ""}>
                    {data.isLoading &&
                      [0, 1, 2, 3, 4].map((i) => (
                        <tr key={i}>
                          <td colSpan={listCols.length} className="px-3 py-2">
                            <div className="fg-skeleton h-5" />
                          </td>
                        </tr>
                      ))}
                    {!data.isLoading && rows.length === 0 && (
                      <tr>
                        <td colSpan={listCols.length} className="px-3 py-10 text-center text-muted-foreground">
                          {search || Object.values(filters).some(Boolean) ? "Không có bản ghi khớp." : "Bảng chưa có dữ liệu."}
                        </td>
                      </tr>
                    )}
                    {rows.map((r) => (
                      <tr key={String(r[pkOf(table)])} onClick={() => setEditing(r)} className="cursor-pointer border-t border-[rgba(38,39,93,0.06)] hover:bg-navy-soft">
                        {listCols.map((c, i) => {
                          const text = display(c, r[c.key], refs);
                          return (
                            <td key={c.key} className="max-w-[280px] truncate px-3 py-2 text-navy" title={text}>
                              {i === 0 ? (
                                <button type="button" onClick={(e) => (e.stopPropagation(), setEditing(r))} className="max-w-full truncate text-left font-semibold hover:underline">
                                  {text || "—"}
                                </button>
                              ) : (
                                text
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-2 text-sm text-navy">
                <span className="tabular-nums text-muted-foreground">
                  Trang {page + 1}/{pages}
                </span>
                <button type="button" aria-label="Trang trước" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg p-2 hover:bg-navy-soft disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Trang sau" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-lg p-2 hover:bg-navy-soft disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        </div>

        {editing && <RecordDialog key={editing === "new" ? "new" : String(editing[pkOf(table)])} table={table} row={editing === "new" ? null : editing} refs={refs} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />}
      </div>
    </PageTransition>
  );
}
