import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, CircleX, Loader2, MapPin, RotateCcw, ShieldCheck, UserRound, Zap } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import { toast } from "@/components/ui/use-toast";
import { reviewSession, useClubData, useEvidence, useInvalidateClubs, useSignedUrls } from "@/lib/clubs/api";
import { checkClock, checkGeo } from "@/lib/clubs/evidence";
import {
  DOW_FULL, REJECT_REASONS, SPORTS, SPORT_ORDER, UNASSIGNED, checkTime, fmtDate, fmtHm, monthKey, parseYmd, scheduledInMonth, slotFor, teacherOf, ymd,
} from "@/lib/clubs/model";
import { CheckChip, ClubChip, PageHeader, StatusPill, chipCls } from "@/components/clubs/ClubUi";
import PhotoViewer, { EvidenceThumb, isFlagged } from "@/components/clubs/PhotoViewer";

const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const inputCls = "fg-input h-10 w-full bg-white px-3 text-sm text-navy";

function RateBar({ rate }) {
  const color = rate >= 85 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-navy-soft">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, rate)}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-navy">{rate}%</span>
    </div>
  );
}

function ReviewCard({ item, urls, staffById, onReview, onOpen }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const { club } = item;
  const d = parseYmd(item.date);
  const slot = slotFor(club, d);
  const teacher = teacherOf(club, staffById);
  const act = async (status, why = null) => {
    setBusy(true);
    try {
      await onReview(item.session.id, status, why);
      setRejecting(false);
    } catch (e) {
      /* lỗi đã hiện bằng thông báo */
    } finally {
      setBusy(false);
    }
  };

  if (item.status === "missing") {
    return (
      <article className="flex flex-col gap-2 rounded-[22px] border border-dashed border-[rgba(38,39,93,0.2)] p-5" style={{ background: "#F7F8FC" }}>
        <div className="flex flex-wrap items-center gap-2">
          <ClubChip club={club} />
          <StatusPill status="missing" />
        </div>
        <h3 className="font-semibold text-navy">
          {DOW_FULL[d.getDay()]}, {fmtDate(d)} · {slot ? `${slot.start}–${slot.end}` : ""}
        </h3>
        <p className="text-sm text-muted-foreground">{teacher} · Buổi này không có ảnh minh chứng.</p>
      </article>
    );
  }

  const photos = item.session.photos;
  return (
    <article className="fg-card flex flex-col gap-4 p-5 sm:flex-row">
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-[300px]">
        {photos.slice(0, 4).map((p, i) => (
          <EvidenceThumb key={p.id} url={urls[p.storage_path]} photo={p} flagged={isFlagged(club, p)} onClick={() => onOpen(item, i)} />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <ClubChip club={club} />
          <StatusPill status={item.status} />
          {photos.length > 4 && <span className="text-xs text-muted-foreground">+{photos.length - 4} ảnh</span>}
        </div>
        <h3 className="font-semibold text-navy">
          {DOW_FULL[d.getDay()]}, {fmtDate(d)} · {slot ? `${slot.start}–${slot.end}` : "Ngoài lịch"}
        </h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {slot ? slot.place : "Không có lịch"}
          </span>
          <span className={`inline-flex items-center gap-1 ${teacher === UNASSIGNED ? "text-amber-700" : ""}`}>
            <UserRound className="w-3.5 h-3.5" aria-hidden="true" /> {teacher}
          </span>
        </p>
        <ul className="flex flex-col gap-1">
          {photos.map((p, i) => (
            <li key={p.id} className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums text-navy">
                Ảnh {i + 1} · {fmtHm(new Date(p.taken_at))}
              </span>
              <CheckChip check={checkTime(club, p.taken_at)} />
              <CheckChip check={checkGeo(p)} />
              <CheckChip check={checkClock(p)} />
            </li>
          ))}
        </ul>
        {item.status === "rejected" && item.session.reason && <p className="text-sm text-rose-700">Lý do: {item.session.reason}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {busy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          {item.status === "pending" && !rejecting && (
            <>
              <button type="button" disabled={busy} onClick={() => act("approved")} className="fg-btn-primary inline-flex h-10 items-center gap-1.5 px-4 text-sm disabled:opacity-60">
                <CircleCheck className="w-4 h-4" aria-hidden="true" /> Phê duyệt
              </button>
              <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">
                <CircleX className="w-4 h-4" aria-hidden="true" /> Từ chối
              </button>
            </>
          )}
          {item.status === "pending" && rejecting && (
            <div className="flex w-full flex-col gap-2 rounded-xl bg-rose-50 p-3">
              <fieldset>
                <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-rose-800">Chọn lý do từ chối</legend>
                <div className="flex flex-col gap-1">
                  {REJECT_REASONS.map((r, i) => (
                    <label key={r} htmlFor={`reason-${item.key}-${i}`} className="flex items-center gap-2 text-sm text-navy">
                      <input id={`reason-${item.key}-${i}`} type="radio" name={`reason-${item.key}`} checked={reason === r} onChange={() => setReason(r)} className="accent-rose-600" />
                      {r}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => act("rejected", reason)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700">
                  Xác nhận từ chối
                </button>
                <button type="button" onClick={() => setRejecting(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-navy hover:bg-white">
                  Huỷ
                </button>
              </div>
            </div>
          )}
          {item.status !== "pending" && (
            <>
              <span className="text-xs text-muted-foreground">
                {item.session.reviewed_at ? `Xử lý lúc ${fmtHm(new Date(item.session.reviewed_at))} ngày ${fmtDate(new Date(item.session.reviewed_at))}` : ""}
                {item.session.reviewed_by && staffById[item.session.reviewed_by] ? ` · ${staffById[item.session.reviewed_by].full_name || staffById[item.session.reviewed_by].email}` : ""}
              </span>
              <button type="button" disabled={busy} onClick={() => act("pending")} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy-soft">
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Hoàn tác
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function EvidenceReview() {
  const { clubs, clubById, staffById, location } = useClubData();
  const invalidate = useInvalidateClubs();
  const now = useMemo(() => new Date(), []);
  // Đầu tháng (ngày 1–10) thường đang chốt tháng vừa kết thúc
  const [offset, setOffset] = useState(() => (now.getDate() <= 10 ? 1 : 0));
  const [clubFilter, setClubFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [groupBy, setGroupBy] = useState("club");
  const [limit, setLimit] = useState(10);
  const [viewer, setViewer] = useState(null);
  const view = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const vKey = monthKey(view);
  const range = useMemo(() => {
    const [y, m] = vKey.split("-").map(Number);
    return { from: `${vKey}-01`, to: ymd(new Date(y, m, 0)) };
  }, [vKey]);
  const evidence = useEvidence(range);
  const sessions = evidence.data || [];

  const teacherName = (c) => teacherOf(c, staffById);
  const teachers = [...new Set(clubs.map(teacherName))].sort((a, b) => a.localeCompare(b, "vi"));
  const rows = clubs.map((club) => {
    const scheduled = scheduledInMonth(club, view.getFullYear(), view.getMonth(), now);
    const scheduledDates = new Set(scheduled.map((x) => x.date));
    const mine = sessions.filter((s) => s.club_id === club.id);
    const dates = new Set(mine.map((s) => s.session_date));
    return {
      club,
      scheduled: scheduled.length,
      withEvidence: mine.filter((s) => scheduledDates.has(s.session_date)).length,
      offSchedule: mine.filter((s) => !scheduledDates.has(s.session_date)).length,
      approved: mine.filter((s) => s.status === "approved").length,
      approvedOnSchedule: mine.filter((s) => s.status === "approved" && scheduledDates.has(s.session_date)).length,
      pending: mine.filter((s) => s.status === "pending").length,
      rejected: mine.filter((s) => s.status === "rejected").length,
      missing: scheduled.filter((x) => !dates.has(x.date) && x.date !== ymd(now)),
    };
  });
  const sum = (list) =>
    list.reduce(
      (t, r) => {
        ["scheduled", "withEvidence", "offSchedule", "approved", "approvedOnSchedule", "pending", "rejected"].forEach((k) => (t[k] += r[k]));
        t.clubs += 1;
        return t;
      },
      { scheduled: 0, withEvidence: 0, offSchedule: 0, approved: 0, approvedOnSchedule: 0, pending: 0, rejected: 0, clubs: 0 }
    );
  const total = sum(rows);
  const summary =
    groupBy === "club"
      ? rows.map((r) => ({ key: r.club.id, title: r.club.name, sub: teacherName(r.club), ...r }))
      : teachers.map((t) => {
          const s = sum(rows.filter((r) => teacherName(r.club) === t));
          return { key: t, title: t, sub: `${s.clubs} CLB`, ...s };
        });
  const rateOf = (r) => (r.scheduled ? Math.round((r.approvedOnSchedule / r.scheduled) * 100) : 0);

  const inScope = (club) => (clubFilter === "all" || clubFilter === club.id) && (teacherFilter === "all" || teacherName(club) === teacherFilter);
  const items = [
    ...sessions.filter((s) => clubById[s.club_id] && inScope(clubById[s.club_id])).map((s) => ({ key: s.id, club: clubById[s.club_id], date: s.session_date, status: s.status, session: s })),
    ...rows.filter((r) => inScope(r.club)).flatMap((r) => r.missing.map((m) => ({ key: `${r.club.id}|${m.date}`, club: r.club, date: m.date, status: "missing" }))),
  ];
  const counts = items.reduce((c, s) => ({ ...c, [s.status]: (c[s.status] || 0) + 1 }), {});
  const order = { pending: 0, missing: 1, rejected: 2, approved: 3 };
  const visible = items.filter((s) => statusFilter === "all" || s.status === statusFilter).sort((a, b) => order[a.status] - order[b.status] || b.date.localeCompare(a.date));
  const validPending = items.filter((s) => s.status === "pending" && s.session.photos.length && s.session.photos.every((p) => !isFlagged(s.club, p)));
  const shown = visible.slice(0, limit);
  const urls = useSignedUrls(shown.flatMap((s) => (s.session ? s.session.photos.slice(0, 4).map((p) => p.storage_path) : [])));

  const review = async (id, status, reason) => {
    try {
      await reviewSession(id, status, reason);
      await invalidate(["evidence"]);
      toast({ title: Array.isArray(id) ? `Đã phê duyệt ${id.length} buổi` : status === "approved" ? "Đã phê duyệt buổi sinh hoạt" : status === "rejected" ? "Đã từ chối minh chứng" : "Đã chuyển về chờ duyệt" });
    } catch (err) {
      toast({ title: "Không lưu được", description: err.message, variant: "destructive" });
      throw err;
    }
  };
  const openPhotos = (item, i) => setViewer({ entries: item.session.photos.map((p) => ({ photo: p, club: item.club, status: item.status })), index: i });

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader icon={ShieldCheck} title="Duyệt minh chứng CLB" subtitle="Phòng Nhân sự kiểm tra ảnh minh chứng từng buổi để tính chuyên cần và phụ cấp giáo viên.">
          <div className="flex items-center gap-1 rounded-2xl bg-white p-1 ring-1 ring-[rgba(38,39,93,0.08)]">
            <button type="button" onClick={() => setOffset((m) => Math.min(6, m + 1))} disabled={offset >= 6} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-navy hover:bg-navy-soft disabled:opacity-30" aria-label="Tháng trước">
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="min-w-[120px] text-center font-extrabold tabular-nums text-navy">
              Tháng {view.getMonth() + 1}/{view.getFullYear()}
            </span>
            <button type="button" onClick={() => setOffset((m) => Math.max(0, m - 1))} disabled={offset === 0} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-navy hover:bg-navy-soft disabled:opacity-30" aria-label="Tháng sau">
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </PageHeader>

        <div className="fg-card mb-6 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-navy">Bảng tổng hợp</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex gap-1" role="group" aria-label="Tổng hợp theo">
                <button type="button" aria-pressed={groupBy === "club"} onClick={() => setGroupBy("club")} className={chipCls(groupBy === "club")}>
                  Theo CLB
                </button>
                <button type="button" aria-pressed={groupBy === "teacher"} onClick={() => setGroupBy("teacher")} className={chipCls(groupBy === "teacher")}>
                  Theo giáo viên
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{offset === 0 ? `Tính đến ${fmtDate(now)}` : "Cả tháng"}</span>
            </div>
          </div>
          <div className="-mx-5 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pl-5 pr-2 font-semibold sm:pl-0">{groupBy === "club" ? "Câu lạc bộ" : "Giáo viên"}</th>
                  <th className="px-2 py-2 text-right font-semibold">Buổi theo lịch</th>
                  <th className="px-2 py-2 text-right font-semibold">Có minh chứng</th>
                  <th className="px-2 py-2 text-right font-semibold">Đã duyệt</th>
                  <th className="px-2 py-2 text-right font-semibold">Chờ duyệt</th>
                  <th className="px-2 py-2 text-right font-semibold">Từ chối</th>
                  <th className="py-2 pl-2 pr-5 font-semibold sm:pr-0">Chuyên cần GV</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...summary, { key: "__total", title: "Tổng cộng", total: true, ...total }].map((r) => (
                  <tr key={r.key} className={r.total ? "font-bold" : "border-b"} style={r.total ? { background: "#F7F8FC" } : undefined}>
                    <td className="py-3 pl-5 pr-2 sm:pl-2">
                      <div className="font-semibold text-navy">{r.title}</div>
                      {r.sub && <div className={`text-xs ${r.sub === UNASSIGNED || r.title === UNASSIGNED ? "text-amber-700" : "text-muted-foreground"}`}>{r.sub}</div>}
                    </td>
                    <td className="px-2 py-3 text-right text-navy">{r.scheduled}</td>
                    <td className="px-2 py-3 text-right text-navy">
                      {r.withEvidence}
                      {r.offSchedule > 0 && <span className="block text-[11px] font-normal text-amber-700">+{r.offSchedule} ngoài lịch</span>}
                    </td>
                    <td className="px-2 py-3 text-right font-semibold text-emerald-700">{r.approved}</td>
                    <td className="px-2 py-3 text-right font-semibold text-amber-700">{r.pending}</td>
                    <td className="px-2 py-3 text-right font-semibold text-rose-700">{r.rejected}</td>
                    <td className="py-3 pl-2 pr-5 sm:pr-2">
                      <RateBar rate={rateOf(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
            <div>
              <label htmlFor="review-club" className={labelCls}>
                Câu lạc bộ
              </label>
              <select id="review-club" className={inputCls} value={clubFilter} onChange={(e) => setClubFilter(e.target.value)}>
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
              <label htmlFor="review-teacher" className={labelCls}>
                Giáo viên
              </label>
              <select id="review-teacher" className={inputCls} value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
                <option value="all">Tất cả giáo viên</option>
                {teachers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo trạng thái">
            {[
              ["pending", "Chờ duyệt"],
              ["missing", "Thiếu minh chứng"],
              ["rejected", "Bị từ chối"],
              ["approved", "Đã duyệt"],
              ["all", "Tất cả"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={statusFilter === k}
                onClick={() => {
                  setStatusFilter(k);
                  setLimit(10);
                }}
                className={chipCls(statusFilter === k)}
              >
                {label}
                <span className="tabular-nums opacity-70">{k === "all" ? items.length : counts[k] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {validPending.length > 0 && (statusFilter === "pending" || statusFilter === "all") && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] px-5 py-3 ring-1 ring-yellow" style={{ background: "#FEF9D7" }}>
            <p className="flex items-center gap-2 text-sm text-navy">
              <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
              {validPending.length} buổi chờ duyệt có mọi ảnh đúng khung giờ, trong khuôn viên và đúng giờ máy chủ.
            </p>
            <button type="button" onClick={() => review(validPending.map((s) => s.session.id), "approved").catch(() => {})} className="fg-btn-secondary inline-flex h-10 items-center gap-1.5 px-4 text-sm">
              <CircleCheck className="w-4 h-4" aria-hidden="true" /> Duyệt nhanh {validPending.length} buổi
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {evidence.isLoading && <div className="fg-skeleton" style={{ height: 160, borderRadius: 22 }} />}
          {shown.map((item) => (
            <ReviewCard key={item.key} item={item} urls={urls} staffById={staffById} onReview={review} onOpen={openPhotos} />
          ))}
          {!evidence.isLoading && visible.length === 0 && (
            <p className="fg-card p-8 text-center text-sm text-muted-foreground">
              Không có buổi nào ở trạng thái này trong tháng {view.getMonth() + 1}/{view.getFullYear()}.
            </p>
          )}
          {visible.length > limit && (
            <button type="button" onClick={() => setLimit((n) => n + 10)} className="fg-btn-secondary self-center h-10 px-5 text-sm">
              Xem thêm · còn {visible.length - limit} buổi
            </button>
          )}
        </div>

        {viewer && (
          <PhotoViewer entries={viewer.entries} index={viewer.index} onIndex={(i) => setViewer((v) => ({ ...v, index: i }))} onClose={() => setViewer(null)} staffById={staffById} location={location} />
        )}
      </div>
    </PageTransition>
  );
}
