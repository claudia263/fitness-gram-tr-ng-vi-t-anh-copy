import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, Hourglass, LayoutGrid, Plus, Table2, Trophy, UserRound } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import { useAuth } from "@/lib/AuthContext";
import { saveClub, useClubData, useEvidence, useInvalidateClubs } from "@/lib/clubs/api";
import {
  CLUB_MANAGERS, DOW_SHORT, LEVELS, SPORTS, SPORT_ORDER, UNASSIGNED, fmtShortDate, groupSlots, levelLabel, nextSession, parseYmd, schoolYear, teacherOf, toneOf, ymd,
} from "@/lib/clubs/model";
import { PageHeader, SportIcon, chipCls } from "@/components/clubs/ClubUi";
import WeeklyTimetable from "@/components/clubs/WeeklyTimetable";
import ClubFormDialog from "@/components/clubs/ClubFormDialog";
import { useTrackView } from "@/lib/usage";

function ClubCard({ club, staffById, pending, now, onOpen }) {
  const tone = toneOf(club);
  const next = nextSession(club, now);
  const teacher = teacherOf(club, staffById);
  const upcoming = club.starts_on && club.starts_on > ymd(now);
  return (
    <article className="fg-card fg-card-hover relative flex min-w-0 flex-col overflow-hidden focus-within:ring-2 focus-within:ring-navy">
      <div className={`flex items-center justify-between gap-2 px-5 py-3 ${tone.soft}`}>
        <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${tone.text}`}>
          <SportIcon sport={club.sport} className="w-4 h-4" />
          {levelLabel(club.levels)}
        </span>
        {club.source === "manual" && (
          <span className="rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">{upcoming ? `Mới · từ ${fmtShortDate(parseYmd(club.starts_on))}` : "Phát sinh"}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg font-extrabold leading-tight text-navy">
            <button type="button" onClick={() => onOpen(club.id)} className="text-left after:absolute after:inset-0 after:content-[''] focus:outline-none">
              {club.name}
            </button>
          </h3>
          <p className={`mt-1 flex items-center gap-1.5 text-sm ${teacher === UNASSIGNED ? "text-amber-700" : "text-muted-foreground"}`}>
            <UserRound className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="font-semibold">{teacher}</span>
          </p>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm text-navy">
          {groupSlots(club.slots).map((g) => (
            <li key={g.start + g.end + g.place} className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0">
                <span className="font-semibold">{g.days.map((d) => DOW_SHORT[d]).join(", ")}</span> <span className="font-mono tabular-nums">{g.start}–{g.end}</span>
                <span className="block text-xs text-muted-foreground">{g.place}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {next ? (next.live ? <span className="font-semibold text-emerald-700">Đang sinh hoạt</span> : `Buổi tới: ${DOW_SHORT[next.d.getDay()]}, ${fmtShortDate(next.d)} · ${next.slot.start}`) : "Không còn buổi nào"}
          </span>
          {pending > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
              <Hourglass className="w-3 h-3" aria-hidden="true" /> {pending} chờ duyệt
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Clubs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clubs, staff, staffById, loading, error } = useClubData();
  const invalidate = useInvalidateClubs();
  const now = useMemo(() => new Date(), []);
  const recent = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 60);
    return { from: ymd(d), to: ymd(now) };
  }, [now]);
  const evidence = useEvidence(recent);
  const [view, setView] = useState(() => sessionStorage.getItem("fg_clubs_view") || "list");
  const [level, setLevel] = useState("all");
  const [adding, setAdding] = useState(false);
  const canManage = CLUB_MANAGERS.includes(user?.role);
  useTrackView("xem_danh_sach_clb");

  const pendingByClub = useMemo(() => {
    const m = {};
    (evidence.data || []).forEach((s) => s.status === "pending" && (m[s.club_id] = (m[s.club_id] || 0) + 1));
    return m;
  }, [evidence.data]);

  const filtered = clubs.filter((c) => level === "all" || c.levels.includes(level));
  const perWeek = filtered.reduce((n, c) => n + c.slots.length, 0);
  const switchView = (v) => {
    setView(v);
    try {
      sessionStorage.setItem("fg_clubs_view", v);
    } catch (e) {
      /* bỏ qua */
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader icon={Trophy} title="Câu lạc bộ thể thao" subtitle={`Năm học ${schoolYear(now)} · CS Gò Vấp · ${filtered.length} CLB · ${perWeek} buổi/tuần`}>
          {canManage && (
            <button type="button" onClick={() => setAdding(true)} className="fg-btn-primary inline-flex h-10 items-center gap-2 px-4 text-sm">
              <Plus className="w-4 h-4" aria-hidden="true" /> Thêm CLB phát sinh
            </button>
          )}
        </PageHeader>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="inline-flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-[rgba(38,39,93,0.08)]" role="group" aria-label="Cách xem">
            <button type="button" aria-pressed={view === "list"} onClick={() => switchView("list")} className={chipCls(view === "list")}>
              <LayoutGrid className="w-4 h-4" aria-hidden="true" /> Theo môn
            </button>
            <button type="button" aria-pressed={view === "timetable"} onClick={() => switchView("timetable")} className={chipCls(view === "timetable")}>
              <Table2 className="w-4 h-4" aria-hidden="true" /> Thời khoá biểu tuần
            </button>
          </div>
          <div className="inline-flex flex-wrap gap-1" role="group" aria-label="Lọc theo khối">
            {[{ key: "all", label: "Tất cả khối" }, ...LEVELS].map((l) => (
              <button key={l.key} type="button" aria-pressed={level === l.key} onClick={() => setLevel(l.key)} className={chipCls(level === l.key)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="fg-card p-6 text-sm text-rose-700">Không tải được danh sách CLB: {error.message}</p>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="fg-skeleton" style={{ height: 220, borderRadius: 22 }} />
            ))}
          </div>
        ) : view === "timetable" ? (
          <WeeklyTimetable clubs={filtered} staffById={staffById} now={now} onOpen={(id) => navigate(`/clb/${id}`)} />
        ) : (
          <div className="flex flex-col gap-8">
            {SPORT_ORDER.map((sp) => {
              const list = filtered.filter((c) => c.sport === sp);
              if (!list.length) return null;
              return (
                <section key={sp} className="flex flex-col gap-3" aria-labelledby={`sport-${sp}`}>
                  <h2 id={`sport-${sp}`} className="flex items-center gap-2 text-lg font-extrabold text-navy">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneOf({ sport: sp }).chip}`}>
                      <SportIcon sport={sp} className="w-4 h-4" />
                    </span>
                    {SPORTS[sp].label}
                    <span className="text-sm font-semibold text-muted-foreground">· {list.length} nhóm</span>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((c) => (
                      <ClubCard key={c.id} club={c} staffById={staffById} pending={pendingByClub[c.id] || 0} now={now} onOpen={(id) => navigate(`/clb/${id}`)} />
                    ))}
                  </div>
                </section>
              );
            })}
            {!filtered.length && <p className="fg-card p-8 text-center text-sm text-muted-foreground">Chưa có CLB nào cho khối đã chọn.</p>}
          </div>
        )}

        {adding && (
          <ClubFormDialog
            open
            club={null}
            clubs={clubs}
            staff={staff}
            staffById={staffById}
            now={now}
            onClose={() => setAdding(false)}
            onSave={async (fields, slots) => {
              const id = await saveClub(null, fields, slots);
              await invalidate(["clubs"]);
              setAdding(false);
              navigate(`/clb/${id}`);
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}
