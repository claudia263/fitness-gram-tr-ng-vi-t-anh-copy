// Chụp ảnh minh chứng bằng camera điện thoại: lấy GPS, đóng dấu giờ – địa chỉ – toạ độ – mã vào ảnh, tải lên kho.
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, LocateFixed, RotateCcw, TriangleAlert, UploadCloud, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { uploadEvidence } from "@/lib/clubs/api";
import { MAX_PHOTO_AGE_MS, distanceM, newPhotoCode, stampPhoto, useGeolocation } from "@/lib/clubs/evidence";
import { DOW_FULL, fmtTime, slotFor, teacherOf } from "@/lib/clubs/model";

export default function EvidenceCamera({ club, staffById, location, onSaved }) {
  const inputRef = useRef(null);
  const gps = useGeolocation(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null); // { url, blob, code, time, pos }
  const [error, setError] = useState("");
  const now = new Date();
  const todaySlot = slotFor(club, now);
  const dist = gps.pos && location ? Math.round(distanceM(gps.pos, location)) : null;
  const inside = dist !== null && dist <= (location?.radius ?? 150);

  useEffect(() => () => preview && URL.revokeObjectURL(preview.url), [preview]);

  const openCamera = () => {
    setError("");
    inputRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (Date.now() - file.lastModified > MAX_PHOTO_AGE_MS) {
      setError("Ảnh này đã chụp từ trước. Hãy chụp trực tiếp bằng camera, không chọn ảnh có sẵn trong máy.");
      return;
    }
    setBusy(true);
    try {
      const time = new Date();
      const code = newPhotoCode();
      const pos = gps.pos;
      const stamped = await stampPhoto(file, {
        time,
        pos,
        location: location || { name: "Trường Việt Anh", address: "", radius: 150 },
        distance: pos && location ? distanceM(pos, location) : null,
        club,
        teacher: teacherOf(club, staffById),
        code,
      });
      setPreview({ ...stamped, code, time, pos });
    } catch (err) {
      setError(err?.message || "Không xử lý được ảnh.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      await uploadEvidence({ clubId: club.id, blob: preview.blob, code: preview.code, deviceTime: preview.time, pos: preview.pos });
      toast({ title: "Đã lưu vào kho minh chứng", description: `Mã ảnh ${preview.code} · ${fmtTime(preview.time)}` });
      setPreview(null);
      onSaved?.();
    } catch (err) {
      setError(err?.code === "42501" ? "Bạn không phụ trách CLB này nên không gửi được minh chứng." : err?.message || "Không tải được ảnh lên.");
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const gpsChip =
    gps.status === "ok" ? (
      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ${inside ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
        <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
        GPS ±{gps.pos.acc} m · {dist === null ? "đã có vị trí" : inside ? `trong khuôn viên (${dist} m)` : `ngoài khuôn viên ${dist} m`}
      </span>
    ) : gps.status === "locating" ? (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-soft px-2 py-1 text-xs font-semibold text-navy">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Đang lấy vị trí GPS…
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">
        <TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />
        {gps.status === "denied" ? "Chưa cho phép vị trí — bật quyền Vị trí cho trình duyệt" : "Máy không lấy được GPS"}
      </span>
    );

  return (
    <div className="fg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="font-bold text-navy">Chụp ảnh minh chứng</h3>
        {gpsChip}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/heic,image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={openCamera}
          disabled={busy}
          className="group relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border-4 border-navy/20 bg-white transition active:scale-95 disabled:opacity-50"
          aria-label="Chụp ảnh minh chứng"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow text-navy">
            {busy ? <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" /> : <Camera className="w-6 h-6" aria-hidden="true" />}
          </span>
        </button>
        <div className="min-w-0 flex-1 basis-56 text-sm">
          <p className="font-semibold text-navy">Bấm để mở camera</p>
          {todaySlot ? (
            <p className="text-muted-foreground">
              Buổi hôm nay: {DOW_FULL[now.getDay()]} {todaySlot.start}–{todaySlot.end} · {todaySlot.place}
            </p>
          ) : (
            <p className="flex items-start gap-1.5 text-amber-700">
              <TriangleAlert className="mt-0.5 w-4 h-4 shrink-0" aria-hidden="true" />
              Hôm nay CLB không có lịch. Ảnh vẫn được lưu nhưng HR sẽ thấy cờ “Ngoài lịch sinh hoạt”.
            </p>
          )}
        </div>
      </div>
      {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
        Ảnh được in sẵn giờ, ngày, thứ, địa chỉ trường, toạ độ GPS kèm sai số, tên CLB, giáo viên và mã xác thực rồi lưu thẳng vào kho. Máy chủ ghi lại giờ nhận ảnh để đối chiếu với giờ trên điện thoại.
      </p>

      {preview && (
        <Dialog open onOpenChange={(o) => !o && !busy && setPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[94vh] overflow-y-auto rounded-[22px] bg-white p-0 gap-0">
            <DialogTitle className="sr-only">Xem lại ảnh trước khi lưu</DialogTitle>
            <DialogDescription className="sr-only">Mã ảnh {preview.code}</DialogDescription>
            <img src={preview.url} alt="Ảnh minh chứng vừa chụp" className="w-full rounded-t-[22px]" />
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-muted-foreground">
                Mã ảnh <span className="font-mono font-bold text-navy">{preview.code}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPreview(null)} disabled={busy} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-navy hover:bg-navy-soft">
                  <X className="w-4 h-4" aria-hidden="true" /> Huỷ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    openCamera();
                  }}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-navy ring-1 ring-[rgba(38,39,93,0.15)] hover:bg-navy-soft"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" /> Chụp lại
                </button>
                <button type="button" onClick={save} disabled={busy} className="fg-btn-primary inline-flex h-10 items-center gap-1.5 px-4 text-sm disabled:opacity-60">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="w-4 h-4" aria-hidden="true" />}
                  Lưu vào kho
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
