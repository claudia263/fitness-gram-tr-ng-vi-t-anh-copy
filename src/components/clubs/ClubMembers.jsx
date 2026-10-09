// Tab "Học viên" của CLB: danh sách học viên, tìm học sinh trong hệ thống để thêm, hoặc nhập tay.
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, TriangleAlert, UserPlus, Users, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { addMember, removeMember, searchStudents, useMembers } from "@/lib/clubs/api";
import { levelLabel, levelOfGrade, norm } from "@/lib/clubs/model";
import { useQueryClient } from "@tanstack/react-query";
import ClubMembersImport from "@/components/clubs/ClubMembersImport";
import { chipCls } from "@/components/clubs/ClubUi";

const inputCls = "fg-input h-10 w-full bg-white px-3 text-sm text-navy";
const btnCls = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold disabled:opacity-50";

const birthYear = (d) => (d ? String(d).slice(0, 4) : null);
const outOfLevel = (club, grade) => {
  const lv = levelOfGrade(grade);
  return !!(lv && club.levels.length && !club.levels.includes(lv));
};

function AddPanel({ club, members, onAdded }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(null);
  const [manual, setManual] = useState(null); // { full_name, class_name }
  const [mode, setMode] = useState("one"); // one | list
  const taken = useMemo(() => new Set(members.map((m) => m.student_id).filter(Boolean)), [members]);

  useEffect(() => {
    const text = q.trim();
    if (norm(text).length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      searchStudents(text)
        .then((rows) => alive && setResults(rows))
        .catch((err) => alive && toast({ title: "Không tìm được học sinh", description: err.message, variant: "destructive" }))
        .finally(() => alive && setSearching(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const add = async (key, member) => {
    setBusy(key);
    try {
      await addMember(club.id, member);
      await onAdded();
      toast({ title: `Đã thêm ${member.full_name} vào CLB` });
      return true;
    } catch (err) {
      toast({ title: "Không thêm được học viên", description: err.message, variant: "destructive" });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const tooShort = norm(q).length < 2;

  return (
    <div className="fg-card min-w-0 p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-navy">Thêm học viên</h3>
        <div className="flex gap-1.5" role="group" aria-label="Cách thêm">
          <button type="button" aria-pressed={mode === "one"} onClick={() => setMode("one")} className={chipCls(mode === "one")}>
            Từng em
          </button>
          <button type="button" aria-pressed={mode === "list"} onClick={() => setMode("list")} className={chipCls(mode === "list")}>
            Cả danh sách
          </button>
        </div>
      </div>
      {mode === "list" ? (
        <ClubMembersImport club={club} members={members} onAdded={onAdded} />
      ) : (
        <>
        <p className="mb-4 text-sm text-muted-foreground">Gõ họ tên học sinh để tìm trong dữ liệu của trường. Khối CLB: {levelLabel(club.levels) || "—"}.</p>
        <label htmlFor="member-search" className="sr-only">
          Tìm học sinh theo họ tên
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input id="member-search" className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="VD: Nguyễn Minh An" autoComplete="off" />
          {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />}
        </div>

        {!tooShort && !searching && (
          <ul className="mt-3 divide-y" aria-live="polite">
            {results.length === 0 && <li className="py-3 text-sm text-muted-foreground">Không tìm thấy học sinh nào khớp “{q.trim()}”.</li>}
            {results.map((s) => {
              const added = taken.has(s.id);
              const warn = outOfLevel(club, s.grade);
              return (
                <li key={s.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.class_name ? `Lớp ${s.class_name}` : null, birthYear(s.birth_date) ? `SN ${birthYear(s.birth_date)}` : null, s.school_year].filter(Boolean).join(" · ")}
                    </p>
                    {warn && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                        <TriangleAlert className="h-3 w-3" aria-hidden="true" /> Ngoài khối của CLB
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={added || busy === s.id}
                    onClick={() => add(s.id, { student_id: s.id, full_name: s.full_name, class_name: s.class_name, grade: s.grade })}
                    className={`${btnCls} ${added ? "bg-slate-100 text-muted-foreground" : "bg-navy text-white hover:bg-navy/90"}`}
                  >
                    {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                    {added ? "Đã có" : "Thêm"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 border-t pt-4">
          {manual ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await add("manual", { full_name: manual.full_name, class_name: manual.class_name.trim() || null, grade: (manual.class_name.match(/^\d+/) || [null])[0] });
                if (ok) setManual(null);
              }}
            >
              <p className="text-sm font-semibold text-navy">Nhập tay học sinh chưa có trong hệ thống</p>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div>
                  <label htmlFor="manual-name" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Họ tên
                  </label>
                  <input id="manual-name" required minLength={2} className={inputCls} value={manual.full_name} onChange={(e) => setManual({ ...manual, full_name: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="manual-class" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Lớp
                  </label>
                  <input id="manual-class" className={inputCls} value={manual.class_name} onChange={(e) => setManual({ ...manual, class_name: e.target.value })} placeholder="VD: 6A1" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy === "manual" || manual.full_name.trim().length < 2} className={`${btnCls} bg-navy text-white hover:bg-navy/90`}>
                  {busy === "manual" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Thêm vào CLB
                </button>
                <button type="button" onClick={() => setManual(null)} className={`${btnCls} text-navy hover:bg-navy-soft`}>
                  Huỷ
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setManual({ full_name: q.trim(), class_name: "" })} className="text-sm font-semibold text-navy underline-offset-2 hover:underline">
              Không tìm thấy em? Nhập tay
            </button>
          )}
        </div>
        </>
      )}
    </div>
  );
}

export default function ClubMembers({ club, canEdit }) {
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useMembers(club.id);
  const [filter, setFilter] = useState("");
  const [confirming, setConfirming] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["members", club.id] });

  const shown = useMemo(() => {
    const f = norm(filter);
    return f ? members.filter((m) => norm(`${m.full_name} ${m.class_name || ""}`).includes(f)) : members;
  }, [members, filter]);

  const remove = async (m) => {
    try {
      await removeMember(m.id);
      setConfirming(null);
      await refresh();
    } catch (err) {
      toast({ title: "Không xoá được học viên", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className={`grid gap-5 ${canEdit ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" : ""}`}>
      {canEdit && <AddPanel club={club} members={members} onAdded={refresh} />}
      <div className="fg-card min-w-0 p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-navy">
            Danh sách học viên{" "}
            <span className="font-normal text-muted-foreground tabular-nums">
              ({members.length}
              {club.expected_size ? ` / ${club.expected_size} dự kiến` : ""})
            </span>
          </h3>
          {members.length > 8 && (
            <input aria-label="Lọc danh sách học viên" className={`${inputCls} h-9 max-w-[220px]`} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Lọc theo tên, lớp" />
          )}
        </div>
        {isLoading ? (
          <div className="fg-skeleton" style={{ height: 120, borderRadius: 16 }} />
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Users className="mb-2 h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{canEdit ? "Chưa có học viên. Tìm học sinh ở khung bên cạnh để thêm vào CLB." : "CLB chưa có học viên. Giáo viên phụ trách sẽ cập nhật danh sách."}</p>
          </div>
        ) : (
          <ol className="divide-y">
            {shown.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{members.indexOf(m) + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{m.full_name}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {m.class_name ? `Lớp ${m.class_name}` : "Chưa rõ lớp"}
                    {!m.student_id && <span className="rounded bg-slate-100 px-1.5 text-[11px] font-medium text-slate-600">Nhập tay</span>}
                    {outOfLevel(club, m.grade) && <span className="text-[11px] font-medium text-amber-700">Ngoài khối</span>}
                  </p>
                </div>
                {canEdit &&
                  (confirming === m.id ? (
                    <span className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => remove(m)} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700">
                        Xoá
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="rounded-lg px-2 py-1 text-xs font-semibold text-navy hover:bg-navy-soft">
                        Huỷ
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirming(m.id)} aria-label={`Xoá ${m.full_name} khỏi CLB`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-700">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ))}
              </li>
            ))}
            {shown.length === 0 && <li className="py-3 text-sm text-muted-foreground">Không có học viên khớp “{filter}”.</li>}
          </ol>
        )}
      </div>
    </div>
  );
}
