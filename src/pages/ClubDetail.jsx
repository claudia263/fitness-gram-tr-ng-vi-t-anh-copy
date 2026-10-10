import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, CalendarDays, Camera, ChevronLeft, Clock, Info, MapPin, Pencil, Trash2, UserRound, Users } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import EmptyState from "@/components/fg/EmptyState";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { deleteClub, saveClub, useClubData, useEvidence, useInvalidateClubs, useMembers, useSignedUrls } from "@/lib/clubs/api";
import {
  CLUB_MANAGERS, DOW_FULL, DOW_SHORT, SPORTS, WEEK_ORDER, durationText, fmtDate, fmtShortDate, hasStarted, levelLabel, nextSession, parseYmd, slotFor, teacherOf, toMin, toneOf, ymd,
} from "@/lib/clubs/model";
import { StatusPill, SportIcon } from "@/components/clubs/ClubUi";
import ClubFormDialog from "@/components/clubs/ClubFormDialog";
import EvidenceCamera from "@/components/clubs/EvidenceCamera";
import ClubMembers from "@/components/clubs/ClubMembers";
import PhotoViewer, { EvidenceThumb, isFlagged } from "@/components/clubs/PhotoViewer";
import { useTrackView } from "@/lib/usage";

const TABS = [
  { key: "schedule", label: "Lịch sinh hoạt", icon: CalendarDays },
  { key: "students", label: "Học viên", icon: Users },
  { key: "evidence", label: "Minh chứng hoạt động", icon: Camera },
];

function MonthCalendar({ club, sessions, now }) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const today = ymd(now);
  const byDate = Object.fromEntries(sessions.map((s) => [s.session_date, s]));
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => new Date(year, month, i + 1))];
  const dot = { approved: "bg-emerald-500", pending: "bg-amber-500", rejected: "bg-rose-500", missing: "border border-slate-400", upcoming: "border border-navy" };
  const stateOf = (d) => {
    const s = byDate[ymd(d)];
    if (s) return s.status;
    const slot = slotFor(club, d);
    if (!slot) return null;
    return hasStarted(d, slot, now) && ymd(d) !== today ? "missing" : "upcoming";
  };
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
        {WEEK_ORDER.map((d) => (
          <div key={d} className="py-1">
            {DOW_SHORT[d]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const st = stateOf(d);
          return (
            <div
              key={i}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm tabular-nums ${st ? "font-semibold text-navy" : "text-muted-foreground/60"} ${ymd(d) === today ? "ring-2 ring-yellow" : ""}`}
              style={{ background: st ? "#F4F5F8" : "transparent" }}
            >
              {d.getDate()}
              <span className={`h-1.5 w-1.5 rounded-full ${st ? dot[st] : ""}`} />
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {[
          ["approved", "Đã duyệt"],
          ["pending", "Chờ duyệt"],
          ["rejected", "Bị từ chối"],
          ["missing", "Thiếu minh chứng"],
          ["upcoming", "Sắp tới"],
        ].map(([k, label]) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${dot[k]}`} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScheduleTab({ club, sessions, now }) {
  const tone = toneOf(club);
  const next = nextSession(club, now);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="fg-card min-w-0 p-5 sm:p-6">
        <h3 className="mb-4 font-bold text-navy">Lịch hằng tuần</h3>
        {(club.starts_on || club.ends_on || club.note) && (
          <p className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2 text-sm text-navy" style={{ background: "#F7F8FC" }}>
            <Info className="mt-0.5 w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Áp dụng {club.starts_on ? `từ ${fmtDate(parseYmd(club.starts_on))}` : "từ đầu năm học"}
              {club.ends_on ? ` đến ${fmtDate(parseYmd(club.ends_on))}` : " đến hết năm học"}.{club.note ? ` ${club.note}` : ""}
            </span>
          </p>
        )}
        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_ORDER.map((d) => {
            const slot = club.slots.find((s) => s.dow === d);
            return (
              <div key={d} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-0.5 py-2 ${d === now.getDay() ? "ring-2 ring-yellow" : ""} ${slot ? tone.soft : ""}`} style={slot ? undefined : { background: "#F7F8FC" }}>
                <span className={`text-xs font-bold uppercase ${slot ? tone.text : "text-muted-foreground"}`}>{DOW_SHORT[d]}</span>
                {slot ? (
                  <span className="flex flex-col items-center font-mono text-[11px] font-semibold leading-tight tabular-nums text-navy">
                    <span>{slot.start}</span>
                    <span className="text-muted-foreground">↓</span>
                    <span>{slot.end}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Nghỉ</span>
                )}
              </div>
            );
          })}
        </div>
        <ul className="mt-5 divide-y">
          {club.slots.map((s) => (
            <li key={s.dow} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
              <span className="w-20 text-sm font-bold text-navy">{DOW_FULL[s.dow]}</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-navy">
                <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                {s.start}–{s.end}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-navy">
                <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {s.place}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{toMin(s.end) - toMin(s.start)} phút</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-[22px] p-5 text-white" style={{ background: "linear-gradient(135deg, #26275D 0%, #3A3B7A 100%)" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">{next?.live ? "Đang sinh hoạt" : "Buổi tiếp theo"}</p>
          {next ? (
            <>
              <p className="mt-1 text-2xl font-extrabold">
                {DOW_FULL[next.d.getDay()]}, {fmtShortDate(next.d)}
              </p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-yellow">
                {next.slot.start}–{next.slot.end}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="w-4 h-4" aria-hidden="true" /> {next.slot.place}
              </p>
              <p className="mt-3 text-xs text-white/60">{next.live ? `Còn ${durationText(next.end - now)} đến khi kết thúc` : `Bắt đầu sau ${durationText(next.start - now)}`}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-white/80">CLB không còn buổi nào trong lịch.</p>
          )}
        </section>
        <div className="fg-card p-5">
          <h3 className="mb-3 font-bold text-navy">
            Tháng {now.getMonth() + 1}/{now.getFullYear()}
          </h3>
          <MonthCalendar club={club} sessions={sessions} now={now} />
        </div>
      </div>
    </div>
  );
}

function EvidenceTab({ club, sessions, canCapture, isAdmin, staffById, location, onSaved }) {
  const [viewer, setViewer] = useState(null);
  const recent = sessions.slice(0, 8);
  const entries = recent.flatMap((s) => s.photos.map((p) => ({ photo: p, club, status: s.status })));
  const urls = useSignedUrls(entries.map((e) => e.photo.storage_path));
  const indexOf = (photo) => entries.findIndex((e) => e.photo.id === photo.id);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {canCapture ? (
        <EvidenceCamera club={club} staffById={staffById} location={location} onSaved={onSaved} />
      ) : (
        <div className="fg-card p-6 text-sm text-muted-foreground">
          <h3 className="mb-2 font-bold text-navy">Chụp ảnh minh chứng</h3>
          Chỉ giáo viên được gán phụ trách CLB này (hoặc Tổ trưởng) mới chụp được minh chứng. Liên hệ Tổ trưởng để được gán tài khoản.
        </div>
      )}
      <div className="fg-card min-w-0 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-navy">Minh chứng gần đây</h3>
          {isAdmin && (
            <Link to={`/clb/kho-anh?clb=${club.id}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-navy hover:bg-navy-soft">
              <Archive className="w-3.5 h-3.5" aria-hidden="true" /> Mở trong kho ảnh
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chưa có ảnh minh chứng nào trong 60 ngày qua.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {recent.map((s) => {
              const d = parseYmd(s.session_date);
              const slot = slotFor(club, d);
              return (
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy">
                      {DOW_FULL[d.getDay()]}, {fmtDate(d)} <span className="ml-1 text-xs font-normal text-muted-foreground">{slot ? `${slot.start}–${slot.end}` : "Ngoài lịch"}</span>
                    </p>
                    <StatusPill status={s.status} />
                  </div>
                  {s.status === "rejected" && s.reason && <p className="text-xs text-rose-700">Lý do từ chối: {s.reason}</p>}
                  <div className="grid grid-cols-3 gap-2">
                    {s.photos.map((p) => (
                      <EvidenceThumb key={p.id} url={urls[p.storage_path]} photo={p} flagged={isFlagged(club, p)} onClick={() => setViewer(indexOf(p))} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {viewer !== null && <PhotoViewer entries={entries} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} staffById={staffById} location={location} />}
    </div>
  );
}

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clubs, clubById, staff, staffById, location, loading } = useClubData();
  const invalidate = useInvalidateClubs();
  const now = useMemo(() => new Date(), []);
  const range = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 60);
    return { from: ymd(d), to: ymd(now), clubId: id };
  }, [now, id]);
  const evidence = useEvidence(range);
  const members = useMembers(id);
  const [tab, setTab] = useState("schedule");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tabRefs = useRef({});
  useTrackView("xem_chi_tiet_clb", { chiTiet: { club_id: id } });

  const club = clubById[id];
  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="fg-skeleton" style={{ height: 200, borderRadius: 22 }} />
      </div>
    );
  }
  if (!club) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState title="Không tìm thấy CLB" description="CLB này có thể đã bị xoá. Quay lại danh sách để chọn CLB khác." />
      </div>
    );
  }

  const tone = toneOf(club);
  const sessions = evidence.data || [];
  const pending = sessions.filter((s) => s.status === "pending").length;
  const canManage = CLUB_MANAGERS.includes(user?.role);
  const canCapture = canManage || (user?.role === "teacher" && club.teacher_id === user?.id);
  const onKeyDown = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.key === tab);
    const n = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].key;
    setTab(n);
    tabRefs.current[n]?.focus();
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/clb" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-navy">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Tất cả CLB
          </Link>
          {canManage && !confirmDelete && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-navy ring-1 ring-[rgba(38,39,93,0.12)] hover:bg-navy-soft">
                <Pencil className="w-4 h-4" aria-hidden="true" /> Sửa CLB
              </button>
              {club.source === "manual" && (
                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">
                  <Trash2 className="w-4 h-4" aria-hidden="true" /> Xoá
                </button>
              )}
            </div>
          )}
          {confirmDelete && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
              Xoá CLB này cùng toàn bộ minh chứng?
              <button
                type="button"
                onClick={async () => {
                  try {
                    await deleteClub(club.id);
                    await invalidate();
                    navigate("/clb");
                  } catch (err) {
                    toast({ title: "Không xoá được CLB", description: err.message, variant: "destructive" });
                  }
                }}
                className="rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-700"
              >
                Xoá CLB
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg px-2 py-1 font-semibold hover:bg-white">
                Huỷ
              </button>
            </div>
          )}
        </div>

        <div className="fg-card mb-5 overflow-hidden">
          <div className={`flex flex-wrap items-end justify-between gap-4 px-5 py-6 sm:px-6 ${tone.soft}`}>
            <div className="min-w-0">
              <p className={`flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide ${tone.text}`}>
                <SportIcon sport={club.sport} className="w-4 h-4" /> {SPORTS[club.sport]?.label} · {levelLabel(club.levels)}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-navy sm:text-4xl">CLB {club.name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-navy">
                <UserRound className="w-4 h-4" aria-hidden="true" /> {teacherOf(club, staffById)}
              </p>
            </div>
            <dl className="flex gap-6">
              {[
                ["Buổi / tuần", club.slots.length],
                ["Học viên", members.data ? `${members.data.length}${club.expected_size ? `/${club.expected_size}` : ""}` : "—"],
                ["Chờ duyệt", pending],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className={`text-3xl font-extrabold tabular-nums ${tone.text}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div role="tablist" aria-label="Thông tin câu lạc bộ" className="flex overflow-x-auto border-t" onKeyDown={onKeyDown}>
            {TABS.map((t) => {
              const active = t.key === tab;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  ref={(el) => (tabRefs.current[t.key] = el)}
                  role="tab"
                  id={`tab-${t.key}`}
                  aria-selected={active}
                  aria-controls={`panel-${t.key}`}
                  tabIndex={active ? 0 : -1}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold focus-visible:bg-navy-soft focus-visible:outline-none ${active ? "text-navy" : "text-muted-foreground hover:text-navy"}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {t.label}
                  {t.key === "evidence" && pending > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-800">{pending}</span>}
                  {active && <span className="absolute inset-x-3 bottom-0 h-1 rounded-full bg-yellow" />}
                </button>
              );
            })}
          </div>
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "schedule" && <ScheduleTab club={club} sessions={sessions} now={now} />}
          {tab === "students" && <ClubMembers club={club} canEdit={canCapture} />}
          {tab === "evidence" && (
            <EvidenceTab club={club} sessions={sessions} canCapture={canCapture} isAdmin={user?.role === "admin"} staffById={staffById} location={location} onSaved={() => invalidate(["evidence"])} />
          )}
        </div>

        {editing && (
          <ClubFormDialog
            open
            club={club}
            clubs={clubs}
            staff={staff}
            staffById={staffById}
            now={now}
            onClose={() => setEditing(false)}
            onSave={async (fields, slots) => {
              await saveClub(club.id, fields, slots);
              await invalidate(["clubs"]);
              setEditing(false);
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}
