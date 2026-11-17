// Quản trị viên của một trường (dùng ở trang /mgis): chủ hệ thống thêm / gỡ người quản trị bằng email.
// Người được thêm chỉ thấy và nhập dữ liệu của đúng trường này (vai trò school_admin, xem migration 0012).
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Loader2, ShieldCheck, Trash2, TriangleAlert, UserPlus } from "lucide-react";
import PageTransition from "@/components/fg/PageTransition";
import { PageHeader } from "@/components/clubs/ClubUi";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { fetchStaff } from "@/lib/clubs/api";
import { SCHOOL, appUrl } from "@/lib/school";
import { inviteStaff, parseStaffLines, revokeStaff, useInvites, useRefreshStaff } from "@/lib/staff";
import { track, useTrackView } from "@/lib/usage";

export default function SchoolStaff() {
  const { user } = useAuth();
  const invites = useInvites();
  const staff = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const refresh = useRefreshStaff();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [copied, setCopied] = useState(false);
  useTrackView("xem_quan_tri_vien_truong");

  const people = useMemo(() => {
    const by = new Map();
    for (const p of staff.data || []) {
      if (p.role === "school_admin" && p.school === SCHOOL.id) by.set(p.email.toLowerCase(), { email: p.email.toLowerCase(), full_name: p.full_name, profileId: p.id, active: true });
    }
    for (const i of invites.data || []) {
      if (i.role !== "school_admin" || i.school !== SCHOOL.id) continue;
      const cur = by.get(i.email);
      if (cur) cur.full_name = cur.full_name || i.full_name;
      else by.set(i.email, { email: i.email, full_name: i.full_name, profileId: null, active: false });
    }
    return [...by.values()].sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email, "vi"));
  }, [staff.data, invites.data]);

  const known = useMemo(() => new Set(people.map((p) => p.email)), [people]);
  const parsed = useMemo(() => parseStaffLines(text), [text]);
  const valid = parsed.filter((p) => p.check.ok && !known.has(p.email));
  const loginUrl = appUrl("/dang-nhap-can-bo");

  const submit = async () => {
    setBusy(true);
    try {
      await inviteStaff(valid.map((p) => ({ ...p, role: "school_admin", school: SCHOOL.id })), { upsert: false });
      track("them_quan_tri_truong", { soLan: valid.length, chiTiet: { truong: SCHOOL.id } });
      toast({ title: `Đã thêm ${valid.length} quản trị viên`, description: "Gửi cho họ đường dẫn đăng nhập ở bên dưới." });
      setText("");
      await refresh();
    } catch (err) {
      toast({ title: "Không thêm được", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    setBusy(true);
    try {
      await revokeStaff(p);
      track("go_quan_tri_truong", { chiTiet: { truong: SCHOOL.id } });
      toast({ title: "Đã gỡ quyền quản trị", description: p.email });
      setConfirm(null);
      await refresh();
    } catch (err) {
      toast({ title: "Không gỡ được", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(loginUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      });
    } catch (e) {
      /* không chép được thì người dùng tự chọn đường dẫn */
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader icon={ShieldCheck} title="Quản trị viên" subtitle={`Người quản lý dữ liệu ${SCHOOL.name}. Họ chỉ thấy và nhập dữ liệu của trường này.`} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="fg-card min-w-0 p-5 sm:p-6">
            <h2 className="mb-1 flex items-center gap-2 font-bold text-navy">
              <UserPlus className="h-5 w-5" aria-hidden="true" /> Thêm quản trị viên
            </h2>
            <label htmlFor="school-staff-lines" className="mb-3 block text-sm text-muted-foreground">
              Mỗi dòng một người: <b className="text-navy">email</b>, có thể kèm họ tên. Thêm được nhiều người một lúc.
            </label>
            <textarea
              id="school-staff-lines"
              rows={5}
              className="fg-input w-full bg-white px-3 py-2 text-sm text-navy"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"ten@mekongxanh.com, Nguyễn Văn A\nten.khac@gmail.com"}
            />
            {parsed.length > 0 && (
              <ul className="mt-3 divide-y rounded-xl ring-1 ring-[rgba(38,39,93,0.08)]" aria-live="polite">
                {parsed.map((p) => {
                  const exists = known.has(p.email);
                  return (
                    <li key={p.email} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-sm">
                      <span className={`min-w-0 truncate font-medium ${p.check.ok && !exists ? "text-navy" : "text-muted-foreground line-through"}`}>{p.email}</span>
                      {p.full_name && <span className="text-muted-foreground">· {p.full_name}</span>}
                      <span className="ml-auto text-xs">
                        {exists ? (
                          <span className="text-muted-foreground">Đã có trong danh sách</span>
                        ) : !p.check.ok ? (
                          <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" /> {p.check.error}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Hợp lệ
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" disabled={!valid.length || busy} onClick={submit} className="fg-btn-secondary mt-4 inline-flex h-10 items-center gap-2 px-5 text-sm disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Thêm {valid.length || ""} người
            </button>
          </div>

          <div className="fg-card min-w-0 p-5 sm:p-6">
            <h2 className="mb-2 font-bold text-navy">Cách đăng nhập lần đầu</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-navy">
              <li>Gửi người được thêm đường dẫn dưới đây.</li>
              <li>Họ đăng nhập bằng Google (đúng email vừa thêm) hoặc "Đăng nhập lần đầu bằng email".</li>
              <li>Vào xong là thấy trang quản trị của {SCHOOL.name}.</li>
            </ol>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-navy-soft px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-xs text-navy">{loginUrl}</code>
              <button type="button" onClick={copyLink} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-navy hover:bg-white">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                {copied ? "Đã chép" : "Chép"}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Nếu đăng nhập bằng Google, địa chỉ <b>{appUrl("/")}/**</b> phải nằm trong danh sách Redirect URLs của Supabase (Authentication → URL Configuration).
            </p>
          </div>
        </div>

        <section className="fg-card mt-5 p-5 sm:p-6" aria-labelledby="school-staff-list">
          <h2 id="school-staff-list" className="mb-3 font-bold text-navy">
            Danh sách quản trị viên <span className="font-normal text-muted-foreground tabular-nums">({people.length})</span>
          </h2>
          {staff.isLoading || invites.isLoading ? (
            <div className="fg-skeleton" style={{ height: 90, borderRadius: 14 }} />
          ) : people.length === 0 ? (
            <p className="rounded-xl px-4 py-6 text-center text-sm text-muted-foreground" style={{ background: "#F7F8FC" }}>
              Chưa có quản trị viên nào của {SCHOOL.name}. Bạn (chủ hệ thống) vẫn quản lý được tất cả.
            </p>
          ) : (
            <ul className="divide-y">
              {people.map((p) => (
                <li key={p.email} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-sm font-semibold text-navy">{p.full_name || p.email}</p>
                    {p.full_name && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {p.active ? "Đã đăng nhập" : "Chờ đăng nhập lần đầu"}
                  </span>
                  {confirm === p.email ? (
                    <span className="flex items-center gap-2 text-sm">
                      Gỡ quyền của người này?
                      <button type="button" disabled={busy} onClick={() => remove(p)} className="rounded-lg bg-rose-600 px-3 py-1 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
                        Gỡ
                      </button>
                      <button type="button" onClick={() => setConfirm(null)} className="rounded-lg px-2 py-1 text-sm font-semibold text-navy hover:bg-navy-soft">
                        Huỷ
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirm(p.email)}
                      disabled={p.email === user?.email?.toLowerCase()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Gỡ quyền
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
