import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Archive, BadgeCheck, CalendarDays, CircleX, Images, LayoutGrid, Loader2, ScanSearch, Search } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import { findPhotoByCode, useClubData, useEvidence, useSignedUrls } from "@/lib/clubs/api";
import { checkClock, checkGeo, cleanCode, formatCode } from "@/lib/clubs/evidence";
import { DOW_WORD, SPORTS, SPORT_ORDER, checkTime, fmtDate, fmtHm, fmtShortDate, norm, parseYmd, teacherOf, ymd } from "@/lib/clubs/model";
import { PageHeader, chipCls } from "@/components/clubs/ClubUi";
import PhotoViewer, { EvidenceThumb } from "@/components/clubs/PhotoViewer";

const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const inputCls = "fg-input h-10 w-full bg-white px-3 text-sm text-navy";
const STATUS_DOT = { pending: "bg-amber-500", approved: "bg-emerald-500", rejected: "bg-rose-500" };

function VerifyPanel({ clubById, onOpen }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (cleanCode(code).length < 8) return;
    setBusy(true);
    try {
      const photo = await findPhotoByCode(formatCode(code));
      const club = photo && clubById[photo.club_id];
      setResult(photo && club ? { photo, club, status: photo.evidence_sessions?.status } : { notFound: formatCode(code) });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fg-card p-5">
      <h3 className="mb-2 flex items-center gap-2 font-bold text-navy">
        <ScanSearch className="w-4 h-4" aria-hidden="true" /> Xác minh mã ảnh
      </h3>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="verify-code" className="text-sm text-muted-foreground">
          Nhập mã in ở góc ảnh để kiểm tra ảnh có đúng là ảnh gốc chụp trong app không.
        </label>
        <div className="flex gap-2">
          <input id="verify-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: VA-7K2Q-9F3M" className={`${inputCls} font-mono uppercase`} />
          <button type="submit" disabled={busy} className="fg-btn-secondary inline-flex h-10 shrink-0 items-center px-4 text-sm disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Xác minh"}
          </button>
        </div>
      </form>
      {result?.photo && (
        <button type="button" onClick={() => onOpen(result)} className="mt-3 w-full rounded-xl bg-emerald-50 p-3 text-left ring-1 ring-emerald-200 hover:bg-emerald-100">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
            <BadgeCheck className="w-4 h-4" aria-hidden="true" /> Ảnh thật · khớp dữ liệu gốc
          </span>
          <span className="mt-1 block text-xs text-emerald-900">
            CLB {result.club.name} · {fmtHm(new Date(result.photo.taken_at))} ngày {fmtDate(new Date(result.photo.taken_at))} · bấm để xem ảnh
          </span>
        </button>
      )}
      {result?.notFound && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-rose-50 p-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <CircleX className="mt-0.5 w-4 h-4 shrink-0" aria-hidden="true" />
          Không có ảnh nào mang mã {result.notFound}. Ảnh có thể đã bị chỉnh sửa, cắt mất dấu hoặc không được chụp trong app.
        </p>
      )}
      {result?.error && <p className="mt-3 text-sm text-rose-700">Không tra cứu được: {result.error}</p>}
    </div>
  );
}

export default function EvidenceArchive() {
  const [params] = useSearchParams();
  const { clubs, clubById, staffById, location } = useClubData();
  const now = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return ymd(d);
  });
  const [to, setTo] = useState(() => ymd(now));
  const [q, setQ] = useState("");
  const [clubFilter, setClubFilter] = useState(params.get("clb") || "all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [groupBy, setGroupBy] = useState("day");
  const [limit, setLimit] = useState(60);
  const [viewer, setViewer] = useState(null); // { entries, index }
  const evidence = useEvidence({ from, to });

  const teachers = useMemo(() => [...new Set(clubs.map((c) => teacherOf(c, staffById)))].sort((a, b) => a.localeCompare(b, "vi")), [clubs, staffById]);
  const all = useMemo(
    () =>
      (evidence.data || [])
        .flatMap((s) => {
          const club = clubById[s.club_id];
          if (!club) return [];
          return s.photos.map((p) => {
            const flags = [checkTime(club, p.taken_at), checkGeo(p), checkClock(p)];
            return { photo: p, club, status: s.status, date: s.session_date, teacher: teacherOf(club, staffById), flagged: flags.some((f) => !f.ok) };
          });
        })
        .sort((a, b) => b.photo.taken_at.localeCompare(a.photo.taken_at)),
    [evidence.data, clubById, staffById]
  );

  const nq = norm(q);
  const list = all.filter(
    (e) =>
      (clubFilter === "all" || e.club.id === clubFilter) &&
      (teacherFilter === "all" || e.teacher === teacherFilter) &&
      (status === "all" || e.status === status) &&
      (!onlyFlagged || e.flagged) &&
      (!nq || norm(`${e.club.name} ${e.teacher} ${e.photo.code}`).includes(nq) || cleanCode(e.photo.code).includes(cleanCode(q)))
  );

  const groups = [];
  const byKey = {};
  for (const e of list) {
    const k = groupBy === "day" ? e.date : e.club.id;
    if (!byKey[k]) {
      const d = parseYmd(e.date);
      byKey[k] = { key: k, title: groupBy === "day" ? `${DOW_WORD[d.getDay()]}, ${fmtDate(d)}` : `CLB ${e.club.name}`, sub: groupBy === "day" ? null : e.teacher, sport: e.club.sport, items: [] };
      groups.push(byKey[k]);
    }
    byKey[k].items.push(e);
  }
  if (groupBy === "club") groups.sort((a, b) => SPORT_ORDER.indexOf(a.sport) - SPORT_ORDER.indexOf(b.sport) || a.title.localeCompare(b.title, "vi"));
  const ordered = groups.flatMap((g) => g.items);
  let budget = limit;
  const visible = [];
  for (const g of groups) {
    if (budget <= 0) break;
    visible.push({ ...g, shown: g.items.slice(0, budget) });
    budget -= g.items.length;
  }
  const shownEntries = visible.flatMap((g) => g.shown);
  const urls = useSignedUrls(shownEntries.map((e) => e.photo.storage_path));
  const sessionsCount = new Set(list.map((e) => `${e.club.id}|${e.date}`)).size;
  const flagged = list.filter((e) => e.flagged).length;
  const open = (e) => setViewer({ entries: ordered, index: ordered.indexOf(e) });

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader icon={Archive} title="Kho ảnh minh chứng" subtitle="Ảnh chụp trong app kèm giờ, địa chỉ, toạ độ GPS và mã xác thực. Giáo viên không sửa hay xoá được ảnh đã lưu." />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="fg-card p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label htmlFor="archive-search" className={labelCls}>
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input id="archive-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tên CLB, giáo viên hoặc mã ảnh" className={`${inputCls} pl-9`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="archive-club" className={labelCls}>
                    Câu lạc bộ
                  </label>
                  <select id="archive-club" className={inputCls} value={clubFilter} onChange={(e) => setClubFilter(e.target.value)}>
                    <option value="all">Tất cả CLB</option>
                    {SPORT_ORDER.map((sp) => {
                      const l = clubs.filter((c) => c.sport === sp);
                      return l.length ? (
                        <optgroup key={sp} label={SPORTS[sp].label}>
                          {l.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null;
                    })}
                  </select>
                </div>
                <div>
                  <label htmlFor="archive-teacher" className={labelCls}>
                    Giáo viên
                  </label>
                  <select id="archive-teacher" className={inputCls} value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
                    <option value="all">Tất cả giáo viên</option>
                    {teachers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="archive-status" className={labelCls}>
                    Trạng thái duyệt
                  </label>
                  <select id="archive-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ HR duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="archive-from" className={labelCls}>
                    Từ ngày
                  </label>
                  <input id="archive-from" type="date" className={inputCls} value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="archive-to" className={labelCls}>
                    Đến ngày
                  </label>
                  <input id="archive-to" type="date" className={inputCls} value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <label htmlFor="archive-flagged" className="inline-flex h-10 items-center gap-2 text-sm font-medium text-navy">
                    <input id="archive-flagged" type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} className="h-4 w-4 accent-amber-500" />
                    Chỉ ảnh bị gắn cờ
                  </label>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold tabular-nums text-navy">{list.length}</span> ảnh · {sessionsCount} buổi
                  {flagged > 0 && <span className="ml-1 font-semibold text-amber-700">· {flagged} ảnh gắn cờ</span>}
                </p>
                <div className="inline-flex gap-1" role="group" aria-label="Nhóm ảnh theo">
                  <button type="button" aria-pressed={groupBy === "day"} onClick={() => setGroupBy("day")} className={chipCls(groupBy === "day")}>
                    <CalendarDays className="w-4 h-4" aria-hidden="true" /> Theo ngày
                  </button>
                  <button type="button" aria-pressed={groupBy === "club"} onClick={() => setGroupBy("club")} className={chipCls(groupBy === "club")}>
                    <LayoutGrid className="w-4 h-4" aria-hidden="true" /> Theo CLB
                  </button>
                </div>
              </div>
            </div>

            {evidence.isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="fg-skeleton" style={{ aspectRatio: "4 / 3", borderRadius: 12 }} />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="fg-card flex flex-col items-center gap-2 p-10 text-center">
                <Images className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold text-navy">Chưa có ảnh nào khớp bộ lọc</p>
                <p className="text-sm text-muted-foreground">Ảnh xuất hiện ở đây ngay khi giáo viên chụp minh chứng trong trang CLB.</p>
              </div>
            ) : (
              visible.map((g) => (
                <section key={g.key} className="flex flex-col gap-3" aria-label={g.title}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
                    <h2 className="text-lg font-extrabold text-navy">
                      {g.title}
                      {g.sub && <span className="ml-2 text-sm font-semibold text-muted-foreground">{g.sub}</span>}
                    </h2>
                    <span className="text-xs tabular-nums text-muted-foreground">{g.items.length} ảnh</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {g.shown.map((e) => (
                      <li key={e.photo.id} className="min-w-0">
                        <EvidenceThumb url={urls[e.photo.storage_path]} photo={e.photo} flagged={e.flagged} onClick={() => open(e)} />
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[e.status]}`} aria-hidden="true" />
                          <span className="font-mono tabular-nums text-navy">{fmtHm(new Date(e.photo.taken_at))}</span>
                          <span className="truncate text-muted-foreground">{groupBy === "day" ? e.club.name : fmtShortDate(parseYmd(e.date))}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
            {list.length > limit && (
              <button type="button" onClick={() => setLimit((n) => n + 60)} className="fg-btn-secondary self-center px-5 h-10 text-sm">
                Tải thêm ảnh · còn {list.length - limit}
              </button>
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <VerifyPanel clubById={clubById} onOpen={(r) => setViewer({ entries: [r], index: 0 })} />
            <div className="fg-card p-5 text-sm text-muted-foreground">
              <h3 className="mb-2 font-bold text-navy">Ảnh bị gắn cờ khi</h3>
              <ul className="list-disc space-y-1 pl-5">
                <li>Chụp ngoài lịch hoặc lệch quá 15 phút so với khung giờ sinh hoạt</li>
                <li>Toạ độ ngoài khuôn viên trường ({location?.radius ?? 150} m) hoặc không có GPS</li>
                <li>Giờ điện thoại lệch giờ máy chủ quá 5 phút</li>
              </ul>
            </div>
          </aside>
        </div>

        {viewer && (
          <PhotoViewer
            entries={viewer.entries}
            index={viewer.index}
            onIndex={(i) => setViewer((v) => ({ ...v, index: i }))}
            onClose={() => setViewer(null)}
            staffById={staffById}
            location={location}
          />
        )}
      </div>
    </PageTransition>
  );
}
