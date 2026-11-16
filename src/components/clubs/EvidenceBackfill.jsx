// Bổ sung ảnh minh chứng cho một ngày đã qua còn thiếu: chọn ảnh có sẵn trong máy, đóng dấu "bổ sung cho buổi ...",
// ghi lý do và gửi. Ảnh vào hàng chờ Phòng Nhân sự duyệt kèm nhãn "ảnh bổ sung".
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, TriangleAlert, UploadCloud, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { uploadEvidenceLate } from "@/lib/clubs/api";
import { newPhotoCode, stampPhoto } from "@/lib/clubs/evidence";
import { DOW_FULL, fmtDate, fmtShortDate, teacherOf, ymd } from "@/lib/clubs/model";

const REASONS = ["Quên chụp trong buổi", "Mất mạng hoặc điện thoại hết pin", "Ảnh chụp bằng máy khác", "Khác"];
const MAX_FILES = 6;

export default function EvidenceBackfill({ club, date, staffById, location, onClose, onSaved }) {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]); // { id, url, blob, code, time, offDay }
  const [reasonKey, setReasonKey] = useState(REASONS[0]);
  const [reasonText, setReasonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const dayLabel = `${DOW_FULL[date.getDay()]}, ${fmtDate(date)}`;
  const reason = reasonKey === "Khác" ? reasonText.trim() : reasonKey;

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_FILES - items.length);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const added = [];
      for (const file of files) {
        // Giờ chụp gốc lấy từ ngày sửa tệp của ảnh; thiếu thì dùng giờ hiện tại
        const time = file.lastModified ? new Date(file.lastModified) : new Date();
        const code = newPhotoCode();
        const stamped = await stampPhoto(file, {
          time,
          pos: null,
          location: location || { name: "Trường Việt Anh", address: "", radius: 150 },
          distance: null,
          club,
          teacher: teacherOf(club, staffById),
          code,
          lateFor: fmtDate(date),
        });
        added.push({ id: code, url: stamped.url, blob: stamped.blob, code, time, offDay: ymd(time) !== ymd(date) });
      }
      setItems((prev) => [...prev, ...added]);
    } catch (err) {
      setError(err?.message || "Không xử lý được ảnh.");
    } finally {
      setBusy(false);
    }
  };

  const drop = (id) =>
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((i) => i.id !== id);
    });

  const send = async () => {
    if (reason.length < 3) {
      setError("Chọn hoặc nhập lý do bổ sung.");
      return;
    }
    setBusy(true);
    setError("");
    let sent = 0;
    try {
      for (const it of items) {
        await uploadEvidenceLate({ clubId: club.id, date, reason, blob: it.blob, code: it.code, deviceTime: it.time });
        sent += 1;
        drop(it.id);
      }
      toast({ title: `Đã bổ sung ${sent} ảnh cho ${fmtShortDate(date)}`, description: "Ảnh đang chờ Phòng Nhân sự duyệt." });
      await onSaved?.();
      onClose();
    } catch (err) {
      if (sent > 0) await onSaved?.();
      setError(err?.message || "Không gửi được ảnh.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-2xl max-h-[94vh] overflow-y-auto rounded-[22px] bg-white p-0 gap-0">
        <div className="p-5 sm:p-6">
          <DialogTitle className="text-lg font-extrabold text-navy">Bổ sung ảnh cho buổi {dayLabel}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            CLB {club.name}. Chọn ảnh đã chụp trong buổi đó. Ảnh được đóng dấu "bổ sung" và chờ Phòng Nhân sự duyệt.
          </DialogDescription>

          <fieldset className="mt-4">
            <legend className="fg-eyebrow mb-1.5">Lý do bổ sung</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {REASONS.map((r) => (
                <label key={r} className="inline-flex items-center gap-1.5 text-sm text-navy">
                  <input type="radio" name="late-reason" checked={reasonKey === r} onChange={() => setReasonKey(r)} className="h-4 w-4 accent-[#26275D]" />
                  {r}
                </label>
              ))}
            </div>
            {reasonKey === "Khác" && (
              <input value={reasonText} onChange={(e) => setReasonText(e.target.value)} aria-label="Lý do bổ sung" placeholder="Ghi lý do…" className="fg-input mt-3 h-10 w-full px-3 text-sm text-navy" />
            )}
          </fieldset>

          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it) => (
              <div key={it.id} className="relative overflow-hidden rounded-xl ring-1 ring-[rgba(38,39,93,0.12)]" style={{ aspectRatio: "4 / 3" }}>
                <img src={it.url} alt={`Ảnh bổ sung ${it.code}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => drop(it.id)} disabled={busy} aria-label={`Bỏ ảnh ${it.code}`} className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-navy/80 text-white hover:bg-navy">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
                {it.offDay && (
                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-amber-400 px-2 py-1 text-xs font-semibold text-navy">
                    <TriangleAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> Ảnh chụp ngày {fmtShortDate(it.time)}
                  </span>
                )}
              </div>
            ))}
            {items.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-navy/25 text-sm font-semibold text-navy hover:bg-navy-soft disabled:opacity-50"
                style={{ aspectRatio: "4 / 3" }}
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-5 h-5" aria-hidden="true" />}
                Chọn ảnh
              </button>
            )}
          </div>
          {items.some((i) => i.offDay) && <p className="mt-3 text-sm text-amber-800">Có ảnh ghi ngày chụp khác với ngày của buổi. Phòng Nhân sự sẽ thấy ngày chụp in trên ảnh khi duyệt.</p>}
          {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-semibold text-navy hover:bg-navy-soft">
              Đóng
            </button>
            <button type="button" onClick={send} disabled={busy || !items.length} className="fg-btn-primary inline-flex h-10 items-center gap-1.5 px-4 text-sm disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="w-4 h-4" aria-hidden="true" />}
              Gửi {items.length || ""} ảnh
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
