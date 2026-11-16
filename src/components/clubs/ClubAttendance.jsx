// Tab "Điểm danh" của CLB: giáo viên đánh dấu có mặt / vắng cho từng học viên.
// Điểm danh được gửi tự động sang app Lương để đối chiếu buổi CLB (xem docs/luong-integration.md).
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Clock, Loader2, RefreshCw, Save, TriangleAlert } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { fetchOutboxBySession, retryOutbox, saveAttendance, saveLuongGroup, setLuongEnabled, useAttendance, useLuongStatus, useMemberCodes, useMembers } from "@/lib/clubs/api";
import { DOW_FULL, fmtDate, parseYmd, slotFor, ymd } from "@/lib/clubs/model";

const inputCls = "fg-input h-10 w-full bg-white px-3 text-sm text-navy";
const btnCls = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold disabled:opacity-50";

const STATUS = {
  pending: { label: "Chờ gửi sang app Lương", cls: "bg-amber-100 text-amber-800" },
  sending: { label: "Đang gửi…", cls: "bg-amber-100 text-amber-800" },
  failed: { label: "Gửi lỗi, sẽ thử lại", cls: "bg-amber-100 text-amber-800" },
  sent: { label: "Đã gửi sang app Lương", cls: "bg-emerald-100 text-emerald-800" },
  dead: { label: "Gửi lỗi, cần xử lý", cls: "bg-rose-100 text-rose-800" },
};

function SyncBadge({ sessionId, isStaff, isAdmin }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["outbox", sessionId], queryFn: () => fetchOutboxBySession(sessionId), enabled: !!sessionId && isStaff, refetchInterval: 20000 });
  if (!sessionId || !isStaff) return null;
  const latest = data[0];
  if (!latest) return <p className="text-xs text-muted-foreground">Chưa xếp gửi sang app Lương (tính năng tắt hoặc chưa có mã học sinh chung).</p>;
  const st = STATUS[latest.status] || STATUS.pending;
  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${st.cls}`}>{st.label}</span>
        <span className="text-muted-foreground">{latest.record_count} học viên</span>
        {latest.response?.unknown_students > 0 && <span className="text-amber-700">{latest.response.unknown_students} mã chưa có trong app Lương</span>}
        {latest.skipped_no_code > 0 && <span className="text-amber-700">{latest.skipped_no_code} học viên chưa có mã nên không gửi</span>}
      </p>
      {latest.last_error && <p className="text-xs text-rose-700">{latest.last_error}</p>}
      {isAdmin && (latest.status === "dead" || latest.status === "failed") && (
        <button
          type="button"
          onClick={async () => {
            try {
              await retryOutbox(latest.id);
              await qc.invalidateQueries({ queryKey: ["outbox", sessionId] });
            } catch (err) {
              toast({ title: "Không thử lại được", description: err.message, variant: "destructive" });
            }
          }}
          className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-navy underline-offset-2 hover:underline"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" /> Thử gửi lại
        </button>
      )}
    </div>
  );
}

// Bật/tắt gửi sang app Lương và mã CLB gửi đi (admin / Tổ trưởng / nhân sự xem; admin bật tắt)
function LuongPanel({ club, role }) {
  const qc = useQueryClient();
  const { data: status } = useLuongStatus(true);
  const [group, setGroup] = useState(club.luong_group || "");
  const [busy, setBusy] = useState(false);
  const canEditGroup = role === "admin" || role === "lead";
  const defaultGroup = `CLB ${club.name}`;
  const counts = status?.counts || {};
  const problems = (counts.dead || 0) + (counts.failed || 0);

  const toggle = async () => {
    setBusy(true);
    try {
      await setLuongEnabled(!status?.enabled);
      await qc.invalidateQueries({ queryKey: ["luong-status"] });
    } catch (err) {
      toast({ title: "Không đổi được cấu hình", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const saveGroup = async () => {
    setBusy(true);
    try {
      await saveLuongGroup(club.id, group);
      await qc.invalidateQueries({ queryKey: ["clubs"] });
      toast({ title: "Đã lưu mã CLB gửi sang app Lương" });
    } catch (err) {
      toast({ title: "Không lưu được", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fg-card p-5 sm:p-6">
      <h3 className="mb-3 font-bold text-navy">Đồng bộ app Lương</h3>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase text-muted-foreground">Trạng thái</dt>
          <dd className="font-semibold text-navy">{status?.enabled ? "Đang bật" : "Đang tắt"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-muted-foreground">Khoá API</dt>
          <dd className={`font-semibold ${status?.has_key ? "text-emerald-700" : "text-amber-700"}`}>{status?.has_key ? "Đã lưu trong Vault" : "Chưa có"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-muted-foreground">Đơn vị</dt>
          <dd className="font-semibold text-navy">{status?.unit || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase text-muted-foreground">Lô theo trạng thái</dt>
          <dd className="text-navy">
            {Object.entries(counts).length ? Object.entries(counts).map(([k, v]) => `${STATUS[k]?.label || k}: ${v}`).join(" · ") : "Chưa có lô nào"}
          </dd>
        </div>
      </dl>
      {status?.disabled_reason && (
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-900">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Đã tự tắt: {status.disabled_reason}
        </p>
      )}
      {problems > 0 && <p className="mt-2 text-xs text-rose-700">{problems} lô đang lỗi. Mở buổi điểm danh tương ứng để xem lý do.</p>}

      <div className="mt-4 border-t pt-4">
        <label htmlFor="luong-group" className="mb-1 block text-xs font-semibold text-muted-foreground">
          Mã / tên CLB gửi sang app Lương
        </label>
        <div className="flex gap-2">
          <input id="luong-group" className={inputCls} value={group} onChange={(e) => setGroup(e.target.value)} placeholder={defaultGroup} disabled={!canEditGroup} />
          {canEditGroup && (
            <button type="button" disabled={busy || group.trim() === (club.luong_group || "")} onClick={saveGroup} className={`${btnCls} bg-navy text-white hover:bg-navy/90`}>
              Lưu
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Phải trùng tên nhóm trong lịch tuần bên app Lương. Để trống sẽ dùng “{defaultGroup}”.</p>
      </div>

      {role === "admin" && (
        <button type="button" disabled={busy || (!status?.enabled && !status?.has_key)} onClick={toggle} className={`${btnCls} mt-4 ${status?.enabled ? "text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50" : "bg-navy text-white hover:bg-navy/90"}`}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {status?.enabled ? "Tắt gửi sang app Lương" : "Bật gửi sang app Lương"}
        </button>
      )}
    </div>
  );
}

export default function ClubAttendance({ club, canEdit, role }) {
  const qc = useQueryClient();
  const today = ymd(new Date());
  const [date, setDate] = useState(today);
  const slotsOfClub = useMemo(() => [...new Set(club.slots.map((s) => s.start))], [club.slots]);
  const scheduled = slotFor(club, parseYmd(date))?.start || null;
  const [slot, setSlot] = useState(scheduled || slotsOfClub[0] || "16:45");
  const { data: members = [], isLoading } = useMembers(club.id);
  const { data: codes = {} } = useMemberCodes(club.id);
  const { data: sessions = [] } = useAttendance(club.id, date);
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const isStaff = ["admin", "lead", "hr"].includes(role);

  // Đổi ngày → chọn lại giờ theo lịch của ngày đó
  useEffect(() => {
    if (scheduled) setSlot(scheduled);
  }, [date, scheduled]);

  const saved = sessions.find((s) => s.slot === slot);
  useEffect(() => {
    setMarks(saved ? { ...saved.marks } : {});
  }, [saved?.id, saved?.revision, date, slot]);

  const markedCount = members.filter((m) => marks[m.id] !== undefined).length;
  const present = members.filter((m) => marks[m.id] === true).length;
  const complete = members.length > 0 && markedCount === members.length;
  const dirty = !saved || members.some((m) => marks[m.id] !== saved.marks[m.id]);
  const noCode = members.filter((m) => codes[m.id] === false);
  const setAll = (v) => setMarks(Object.fromEntries(members.map((m) => [m.id, v])));

  const save = async () => {
    setSaving(true);
    try {
      const res = await saveAttendance({ clubId: club.id, date, slot, marks });
      toast({ title: "Đã lưu điểm danh", description: `${res.present} có mặt, ${res.absent} vắng` });
      await Promise.all([qc.invalidateQueries({ queryKey: ["attendance", club.id] }), qc.invalidateQueries({ queryKey: ["outbox"] })]);
    } catch (err) {
      toast({ title: "Không lưu được điểm danh", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const d = parseYmd(date);
  return (
    <div className={`grid gap-5 ${isStaff ? "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" : ""}`}>
      <div className="fg-card min-w-0 p-5 sm:p-6">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="att-date" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Ngày học
            </label>
            <input id="att-date" type="date" className={inputCls} value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="att-slot" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Giờ bắt đầu
            </label>
            <input id="att-slot" type="time" className={inputCls} value={slot} onChange={(e) => e.target.value && setSlot(e.target.value)} />
          </div>
        </div>
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-navy">
          <span className="font-semibold">
            {DOW_FULL[d.getDay()]}, {fmtDate(d)}
          </span>
          {scheduled ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Lịch: {scheduled}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> Ngày này không có trong lịch của CLB (buổi bù/phát sinh)
            </span>
          )}
        </p>

        {isLoading ? (
          <div className="fg-skeleton" style={{ height: 120, borderRadius: 16 }} />
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">CLB chưa có học viên. Thêm học viên ở tab “Học viên” trước khi điểm danh.</p>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                Đã đánh dấu {markedCount}/{members.length} · có mặt {present}
              </p>
              {canEdit && (
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setAll(true)} className={`${btnCls} h-8 text-navy ring-1 ring-[rgba(38,39,93,0.12)] hover:bg-navy-soft`}>
                    Tất cả có mặt
                  </button>
                  <button type="button" onClick={() => setMarks({})} className={`${btnCls} h-8 text-muted-foreground hover:bg-navy-soft`}>
                    Xoá đánh dấu
                  </button>
                </div>
              )}
            </div>
            <ol className="divide-y">
              {members.map((m, i) => {
                const v = marks[m.id];
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.class_name ? `Lớp ${m.class_name}` : "Chưa rõ lớp"}
                        {codes[m.id] === false && <span className="ml-2 font-medium text-amber-700">Chưa có mã học sinh chung</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1" role="group" aria-label={`Điểm danh ${m.full_name}`}>
                      {[
                        [true, "Có mặt", "bg-emerald-600 text-white"],
                        [false, "Vắng", "bg-rose-600 text-white"],
                      ].map(([val, label, on]) => (
                        <button
                          key={label}
                          type="button"
                          disabled={!canEdit}
                          aria-pressed={v === val}
                          onClick={() => setMarks({ ...marks, [m.id]: val })}
                          className={`h-8 rounded-lg px-3 text-xs font-semibold disabled:cursor-default ${v === val ? on : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>

            {noCode.length > 0 && (
              <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {noCode.length} học viên chưa có mã học sinh chung (nhập tay hoặc chưa ghép mã từ Việt Anh Class): vẫn điểm danh được nhưng sẽ không gửi sang app Lương.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex min-w-0 flex-col gap-1">
                {saved ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Đã lưu (lần {saved.revision})
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Buổi này chưa được điểm danh.</p>
                )}
                <SyncBadge sessionId={saved?.id} isStaff={isStaff} isAdmin={role === "admin"} />
              </div>
              {canEdit ? (
                <button type="button" disabled={saving || !complete || !dirty} onClick={save} className={`${btnCls} bg-navy text-white hover:bg-navy/90`}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  {saved ? "Lưu thay đổi" : "Lưu điểm danh"}
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">Chỉ giáo viên phụ trách (hoặc Tổ trưởng) điểm danh được.</p>
              )}
            </div>
            {canEdit && !complete && <p className="mt-2 text-xs text-muted-foreground">Cần đánh dấu có mặt hoặc vắng cho tất cả học viên mới lưu được.</p>}
          </>
        )}
      </div>
      {isStaff && <LuongPanel club={club} role={role} />}
    </div>
  );
}
