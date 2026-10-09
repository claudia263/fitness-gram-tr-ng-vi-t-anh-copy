// Trang "Cán bộ": admin / Tổ trưởng thêm người bằng email, đổi vai trò, gỡ quyền, gán CLB phụ trách.
import { useMemo, useState } from "react";
import { CircleCheck, Hourglass, Info, Loader2, Trophy, TriangleAlert, UserPlus, Users } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import { PageHeader, chipCls } from "@/components/clubs/ClubUi";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useClubData } from "@/lib/clubs/api";
import { ROLE_LABELS, STAFF_ROLES, norm, teacherOf } from "@/lib/clubs/model";
import { inviteStaff, parseStaffLines, revokeStaff, setRole, setTeacherClubs, useInvites, useRefreshStaff } from "@/lib/staff";
import { track, useTrackView } from "@/lib/usage";

const btnCls = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold disabled:opacity-50";
const ROLE_ORDER = ["admin", "lead", "hr", "teacher"];
const ROLE_HINT = {
  admin: "Toàn quyền: dữ liệu thể lực, CLB, duyệt, tài khoản",
  lead: "Quản lý CLB, lịch, chụp minh chứng mọi CLB, mời giáo viên",
  hr: "Xem kho ảnh, duyệt / từ chối minh chứng",
  teacher: "Chụp minh chứng, thêm học viên cho CLB mình phụ trách",
};

function AddStaff({ isAdmin, people, onDone }) {
  const [text, setText] = useState("");
  const [role, setRoleValue] = useState("teacher");
  const [busy, setBusy] = useState(false);
  const known = useMemo(() => new Set(people.map((p) => p.email)), [people]);
  const parsed = useMemo(() => parseStaffLines(text), [text]);
  const valid = parsed.filter((p) => p.check.ok && !known.has(p.email));

  const submit = async () => {
    setBusy(true);
    try {
      await inviteStaff(valid.map((p) => ({ ...p, role })), { upsert: false });
      track("them_can_bo", { soLan: valid.length, chiTiet: { vai_tro: role } });
      toast({ title: `Đã thêm ${valid.length} cán bộ`, description: "Gửi cho từng người hướng dẫn đăng nhập lần đầu bên dưới." });
      setText("");
      await onDone();
    } catch (err) {
      toast({ title: "Không thêm được", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fg-card min-w-0 p-5 sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 font-bold text-navy">
        <UserPlus className="h-5 w-5" aria-hidden="true" /> Thêm cán bộ
      </h2>
      <label htmlFor="staff-lines" className="mb-3 block text-sm text-muted-foreground">
        Mỗi dòng một người: <b className="text-navy">email</b>, có thể kèm họ tên. Thêm được nhiều người một lúc.
      </label>
      <textarea
        id="staff-lines"
        rows={5}
        className="fg-input w-full bg-white px-3 py-2 text-sm text-navy"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"kiet.le@truongvietanh.com, Thầy Kiệt\nhieu.nguyentrung@truongvietanh.com, Thầy Hiếu"}
      />

      {parsed.length > 0 && (
        <ul className="mt-3 divide-y rounded-xl ring-1 ring-[rgba(38,39,93,0.08)]" aria-live="polite">
          {parsed.map((p) => {
            const exists = known.has(p.email);
            return (
              <li key={p.email} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-sm">
                <span className={`min-w-0 truncate font-medium ${p.check.ok && !exists ? "text-navy" : "text-muted-foreground line-through"}`}>{p.email}</span>
                {p.full_name && <span className="text-muted-foreground">· {p.full_name}</span>}
                <span className="ml-auto flex items-center gap-1.5 text-xs">
                  {exists ? (
                    <span className="text-muted-foreground">Đã có trong danh sách</span>
                  ) : !p.check.ok ? (
                    <>
                      <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> {p.check.error}
                      </span>
                      {p.check.fix && (
                        <button type="button" onClick={() => setText((t) => t.split(p.email).join(p.check.fix))} className="rounded-md bg-navy px-2 py-0.5 font-semibold text-white">
                          Sửa
                        </button>
                      )}
                    </>
                  ) : p.check.warning ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                      <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> {p.check.warning}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> Hợp lệ
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="staff-role" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vai trò
          </label>
          <select id="staff-role" className="fg-input h-10 w-full bg-white px-3 text-sm text-navy" value={role} disabled={!isAdmin} onChange={(e) => setRoleValue(e.target.value)}>
            {(isAdmin ? ROLE_ORDER : ["teacher"]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <button type="button" disabled={!valid.length || busy} onClick={submit} className="fg-btn-secondary inline-flex h-10 items-center gap-2 px-5 text-sm disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Thêm {valid.length || ""} người
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {ROLE_HINT[role]}.{!isAdmin && " Tổ trưởng chỉ thêm được giáo viên."}
      </p>
    </div>
  );
}

function Guide() {
  return (
    <div className="fg-card p-5 sm:p-6 text-sm text-navy">
      <h2 className="mb-2 flex items-center gap-2 font-bold">
        <Info className="h-5 w-5" aria-hidden="true" /> Người được thêm vào app thế nào?
      </h2>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Mở <b>fitness.truongvietanh.com</b> → chọn <b>Cán bộ nhà trường</b>.
        </li>
        <li>
          Bấm <b>Đăng nhập lần đầu bằng email</b>, nhập đúng email đã được thêm → mở hộp thư, bấm link đăng nhập. (Nếu có nút <b>Đăng nhập bằng Google</b> thì bấm luôn nút đó.)
        </li>
        <li>Vào được app là có quyền ngay. Muốn đăng nhập bằng mật khẩu về sau: dùng “Quên mật khẩu?” để đặt mật khẩu.</li>
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">Trạng thái “Chờ đăng nhập lần đầu” chuyển thành “Đã kích hoạt” khi người đó vào app lần đầu.</p>
    </div>
  );
}

function ClubsDialog({ person, clubs, staffById, onClose, onSaved }) {
  const [picked, setPicked] = useState(() => clubs.filter((c) => c.teacher_id === person.profileId).map((c) => c.id));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await setTeacherClubs(person.profileId, picked, clubs);
      track("gan_clb_giao_vien", { soLan: picked.length, chiTiet: { giao_vien: person.profileId } });
      toast({ title: "Đã cập nhật CLB phụ trách" });
      await onSaved();
      onClose();
    } catch (err) {
      toast({ title: "Không lưu được", description: err.message, variant: "destructive" });
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-[22px] bg-white p-0 gap-0">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="text-xl font-extrabold text-navy">CLB phụ trách</DialogTitle>
          <DialogDescription>{person.full_name || person.email} được chụp minh chứng và thêm học viên cho các CLB được tích.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y px-5 py-2">
          {clubs.map((c) => {
            const other = c.teacher_id && c.teacher_id !== person.profileId ? teacherOf(c, staffById) : null;
            return (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm text-navy">
                  <input type="checkbox" className="h-4 w-4 accent-[#26275D]" checked={picked.includes(c.id)} onChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))} />
                  <span className="min-w-0 flex-1 font-medium">{c.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{other ? `Đang: ${other}` : c.teacher_id ? "" : c.teacher_name ? `TKB: ${c.teacher_name}` : "Chưa có GV"}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-navy hover:bg-navy-soft">
            Huỷ
          </button>
          <button type="button" onClick={save} disabled={busy} className="fg-btn-secondary inline-flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Lưu
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PersonRow({ person, isAdmin, isMe, clubs, onChanged, onClubs }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const theirClubs = person.profileId ? clubs.filter((c) => c.teacher_id === person.profileId) : [];
  const run = async (fn, okTitle) => {
    setBusy(true);
    try {
      await fn();
      toast({ title: okTitle });
      await onChanged();
    } catch (err) {
      toast({ title: "Không thực hiện được", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="min-w-[220px] flex-1">
        <p className="truncate text-sm font-semibold text-navy">
          {person.full_name || "—"} {isMe && <span className="text-xs font-normal text-muted-foreground">(bạn)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{person.email}</p>
      </div>
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${person.profileId ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
        {person.profileId ? <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />}
        {person.profileId ? "Đã kích hoạt" : "Chờ đăng nhập lần đầu"}
      </span>
      <div className="w-44">
        {isAdmin && !isMe ? (
          <select
            aria-label={`Vai trò của ${person.email}`}
            className="fg-input h-9 w-full bg-white px-2 text-sm text-navy"
            value={person.role}
            disabled={busy}
            onChange={(e) => {
              const role = e.target.value;
              run(async () => {
                await setRole(person, role);
                track("doi_vai_tro_can_bo", { chiTiet: { vai_tro: role } });
              }, `Đã đổi vai trò thành ${ROLE_LABELS[role]}`);
            }}
          >
            {ROLE_ORDER.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-navy">{ROLE_LABELS[person.role]}</span>
        )}
      </div>
      <div className="flex min-w-[160px] flex-1 flex-wrap items-center gap-1.5">
        {person.role === "teacher" || person.role === "lead" ? (
          <>
            {theirClubs.map((c) => (
              <span key={c.id} className="rounded-md bg-navy-soft px-1.5 py-0.5 text-[11px] font-medium text-navy">
                {c.name}
              </span>
            ))}
            {person.profileId ? (
              <button type="button" onClick={onClubs} className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold text-navy underline-offset-2 hover:underline">
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> {theirClubs.length ? "Sửa CLB" : "Gán CLB"}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">Gán CLB sau khi kích hoạt</span>
            )}
          </>
        ) : null}
      </div>
      {isAdmin && !isMe && (
        <div className="shrink-0">
          {confirm ? (
            <span className="flex items-center gap-1 text-xs">
              <button type="button" disabled={busy} onClick={() => run(async () => { await revokeStaff(person); track("go_quyen_can_bo"); }, "Đã gỡ quyền cán bộ")} className="rounded-lg bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-700">
                Gỡ quyền
              </button>
              <button type="button" onClick={() => setConfirm(false)} className="rounded-lg px-2 py-1 font-semibold text-navy hover:bg-navy-soft">
                Huỷ
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
              Gỡ quyền
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function Staff() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { clubs, staff, staffById, loading } = useClubData();
  const invites = useInvites();
  const refresh = useRefreshStaff();
  const [roleFilter, setRoleFilter] = useState("all");
  const [clubsFor, setClubsFor] = useState(null);
  useTrackView("xem_can_bo");

  // Gộp tài khoản đã có (profiles) và lời mời chưa kích hoạt (staff_invites) theo email
  const people = useMemo(() => {
    const byEmail = new Map();
    for (const p of staff.filter((s) => STAFF_ROLES.includes(s.role))) {
      byEmail.set(norm(p.email), { email: p.email.toLowerCase(), full_name: p.full_name, role: p.role, profileId: p.id });
    }
    for (const i of invites.data || []) {
      const cur = byEmail.get(norm(i.email));
      if (cur) cur.full_name = cur.full_name || i.full_name;
      else byEmail.set(norm(i.email), { email: i.email, full_name: i.full_name, role: i.role, profileId: null });
    }
    return [...byEmail.values()].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || (a.full_name || a.email).localeCompare(b.full_name || b.email, "vi"));
  }, [staff, invites.data]);
  const shown = roleFilter === "all" ? people : people.filter((p) => p.role === roleFilter);

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader icon={Users} title="Cán bộ" subtitle="Thêm người dùng app bằng email trường, phân vai trò và CLB phụ trách" />

        <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <AddStaff isAdmin={isAdmin} people={people} onDone={refresh} />
          <Guide />
        </div>

        <section className="fg-card p-5 sm:p-6" aria-labelledby="staff-list">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="staff-list" className="font-bold text-navy">
              Danh sách cán bộ <span className="font-normal text-muted-foreground tabular-nums">({people.length})</span>
            </h2>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo vai trò">
              {["all", ...ROLE_ORDER].map((r) => (
                <button key={r} type="button" aria-pressed={roleFilter === r} onClick={() => setRoleFilter(r)} className={chipCls(roleFilter === r)}>
                  {r === "all" ? "Tất cả" : ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          {loading || invites.isLoading ? (
            <div className="fg-skeleton" style={{ height: 160, borderRadius: 16 }} />
          ) : invites.error ? (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">Không đọc được danh sách: {invites.error.message}</p>
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có cán bộ nào.</p>
          ) : (
            <ul className="divide-y">
              {shown.map((p) => (
                <PersonRow key={p.email} person={p} isAdmin={isAdmin} isMe={p.profileId === user?.id} clubs={clubs} onChanged={refresh} onClubs={() => setClubsFor(p)} />
              ))}
            </ul>
          )}
        </section>

        {clubsFor && <ClubsDialog person={clubsFor} clubs={clubs} staffById={staffById} onClose={() => setClubsFor(null)} onSaved={refresh} />}
      </div>
    </PageTransition>
  );
}
