// Ảnh minh chứng: ô ảnh nhỏ (link tạm từ kho riêng tư) và khung xem chi tiết có chuyển ảnh.
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, ImageOff, TriangleAlert } from "lucide-react";
import { useSignedUrls } from "@/lib/clubs/api";
import { checkClock, checkGeo, fmtCoord, mapsUrl } from "@/lib/clubs/evidence";
import { DOW_WORD, checkTime, fmtDate, fmtTime, teacherOf } from "@/lib/clubs/model";
import { CheckChip, ClubChip, StatusPill } from "@/components/clubs/ClubUi";

export const isFlagged = (club, photo) => !checkTime(club, photo.taken_at).ok || !checkGeo(photo).ok || !checkClock(photo).ok;

export function EvidenceThumb({ url, photo, flagged, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-xl bg-navy-soft ring-1 ring-[rgba(38,39,93,0.08)] transition hover:ring-2 hover:ring-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      style={{ aspectRatio: "4 / 3" }}
      aria-label={label || `Xem ảnh ${photo.code}`}
    >
      {url ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="fg-skeleton absolute inset-0" />}
      {flagged && (
        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-amber-400 px-1 py-0.5 text-[10px] font-bold uppercase text-navy">
          <TriangleAlert className="w-3 h-3" aria-hidden="true" /> Cờ
        </span>
      )}
    </button>
  );
}

function CopyCode({ code }) {
  const inputRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const fallback = () => inputRef.current?.select();
    try {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }, fallback);
    } catch (e) {
      fallback();
    }
  };
  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        readOnly
        value={code}
        aria-label="Mã xác thực ảnh"
        onFocus={(e) => e.target.select()}
        className="w-[9.5rem] rounded-lg bg-navy-soft px-2 py-1 font-mono text-sm font-bold tracking-wider text-navy"
      />
      <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-navy hover:bg-navy-soft">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
        {copied ? "Đã chép" : "Chép"}
      </button>
    </div>
  );
}

// entries: [{ photo, club, status }]
export default function PhotoViewer({ entries, index, onIndex, onClose, staffById, location }) {
  const item = entries[index];
  const urls = useSignedUrls(item ? [item.photo.storage_path] : []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" && index < entries.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, entries.length, onIndex]);
  if (!item) return null;
  const { photo, club, status } = item;
  const url = urls[photo.storage_path];
  const t = new Date(photo.taken_at);
  const device = photo.device_time ? new Date(photo.device_time) : null;
  const geo = photo.lat != null ? { lat: photo.lat, lon: photo.lon } : null;
  const dt = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
  const navBtn = "absolute top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/70 text-white hover:bg-navy disabled:opacity-30";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[94vh] overflow-y-auto rounded-[22px] bg-white p-0 gap-0">
        <DialogTitle className="sr-only">Ảnh minh chứng {photo.code}</DialogTitle>
        <DialogDescription className="sr-only">
          CLB {club.name}, chụp lúc {fmtTime(t)} ngày {fmtDate(t)}
        </DialogDescription>
        <div className="relative bg-navy">
          {url ? (
            <img src={url} alt={`Ảnh minh chứng CLB ${club.name}`} className="mx-auto max-h-[62vh] w-auto" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-white/60">
              <ImageOff className="w-8 h-8" aria-hidden="true" />
            </div>
          )}
          {entries.length > 1 && (
            <>
              <button type="button" onClick={() => onIndex(index - 1)} disabled={index === 0} className={`${navBtn} left-3`} aria-label="Ảnh trước">
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onIndex(index + 1)} disabled={index === entries.length - 1} className={`${navBtn} right-3`} aria-label="Ảnh sau">
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ClubChip club={club} />
              <StatusPill status={status} />
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" /> Ảnh chụp trực tiếp trong app
              </span>
            </div>
            {entries.length > 1 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                Ảnh {index + 1}/{entries.length} · phím ← → để chuyển
              </span>
            )}
          </div>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className={dt}>Mã xác thực</dt>
              <dd className="mt-0.5">
                <CopyCode code={photo.code} />
              </dd>
            </div>
            <div>
              <dt className={dt}>Máy chủ nhận ảnh</dt>
              <dd className="font-mono font-semibold tabular-nums text-navy">
                {fmtTime(t)} · {DOW_WORD[t.getDay()]}, {fmtDate(t)}
              </dd>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                <CheckChip check={checkTime(club, photo.taken_at)} />
                <CheckChip check={checkClock(photo)} />
              </dd>
            </div>
            <div>
              <dt className={dt}>Giờ in trên ảnh</dt>
              <dd className="font-mono tabular-nums text-navy">{device ? `${fmtTime(device)} · ${fmtDate(device)}` : "—"}</dd>
            </div>
            <div>
              <dt className={dt}>Giáo viên phụ trách</dt>
              <dd className="font-semibold text-navy">{teacherOf(club, staffById)}</dd>
              {photo.taken_by && staffById?.[photo.taken_by] && <dd className="text-xs text-muted-foreground">Người chụp: {staffById[photo.taken_by].full_name || staffById[photo.taken_by].email}</dd>}
            </div>
            <div className="sm:col-span-2">
              <dt className={dt}>Địa chỉ</dt>
              <dd className="font-semibold text-navy">{location ? `${location.name} · ${location.address}` : "—"}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className={dt}>Toạ độ GPS</dt>
              <dd className="font-mono tabular-nums text-navy">{geo ? `${fmtCoord(geo)} · ±${Math.round(photo.accuracy_m)} m` : "Không có vị trí (chưa cho phép GPS)"}</dd>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <CheckChip check={checkGeo(photo)} />
                {geo && (
                  <a href={mapsUrl(geo)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-navy underline-offset-2 hover:underline">
                    Mở bản đồ <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
