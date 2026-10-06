// Ảnh minh chứng: GPS của điện thoại, mã xác thực và dấu thời gian – vị trí in thẳng vào ảnh.
import { useEffect, useState } from "react";
import { DOW_WORD, fmtDate, fmtHm, pad } from "@/lib/clubs/model";

export const MAX_PHOTO_AGE_MS = 5 * 60 * 1000; // ảnh phải vừa chụp, không chọn ảnh cũ trong máy
const MAX_SIDE = 1600;

/* ------------------------------ GPS ------------------------------ */
export function distanceM(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
export const fmtCoord = (g) => `${g.lat.toFixed(5)}°N, ${g.lon.toFixed(5)}°E`;
export const mapsUrl = (g) => `https://www.google.com/maps?q=${g.lat},${g.lon}`;

// Theo dõi vị trí khi đang ở màn chụp ảnh. status: locating | ok | denied | unavailable
export function useGeolocation(active) {
  const [state, setState] = useState({ status: "locating", pos: null });
  useEffect(() => {
    if (!active) return undefined;
    if (!("geolocation" in navigator)) {
      setState({ status: "unavailable", pos: null });
      return undefined;
    }
    setState((s) => ({ ...s, status: s.pos ? "ok" : "locating" }));
    const id = navigator.geolocation.watchPosition(
      (p) => setState({ status: "ok", pos: { lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy) } }),
      (err) => setState((s) => ({ status: err.code === err.PERMISSION_DENIED ? "denied" : s.pos ? "ok" : "unavailable", pos: s.pos })),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);
  return state;
}

// Ảnh trong kho: trong / ngoài khuôn viên theo khoảng cách máy chủ đã tính
export function checkGeo(photo) {
  if (photo.inside_campus === null || photo.inside_campus === undefined) return { ok: false, label: "Không có GPS" };
  const d = Math.round(photo.distance_m);
  return photo.inside_campus ? { ok: true, label: `Trong khuôn viên · ${d} m` } : { ok: false, label: `Ngoài khuôn viên · ${d} m` };
}

// Giờ điện thoại in trên ảnh lệch giờ máy chủ quá 5 phút → có thể đã chỉnh giờ máy
export function checkClock(photo) {
  if (!photo.device_time) return { ok: true, label: "" };
  const diff = Math.abs(new Date(photo.device_time) - new Date(photo.taken_at));
  return diff > 5 * 60 * 1000 ? { ok: false, label: `Giờ máy lệch ${Math.round(diff / 60000)} phút` } : { ok: true, label: "" };
}

/* ------------------------------ mã xác thực ------------------------------ */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newPhotoCode() {
  const bytes = new Uint32Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `VA-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}
export const cleanCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const formatCode = (s) => {
  const c = cleanCode(s).replace(/^VA/, "");
  return c.length === 8 ? `VA-${c.slice(0, 4)}-${c.slice(4)}` : String(s || "").trim().toUpperCase();
};

/* ------------------------------ dấu trên ảnh ------------------------------ */
const FONT = '"Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

async function loadBitmap(file) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
      /* trình duyệt cũ: dùng thẻ img */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const PIN = new Path2D("M0 -9c-3.3 0-5.8 2.5-5.8 5.7 0 4.2 5.8 9.8 5.8 9.8s5.8-5.6 5.8-9.8C5.8 -6.5 3.3 -9 0 -9zm0 7.8a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2z");

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

// Vẽ dấu kiểu camera chấm công. Toạ độ thiết kế theo khung 400×300, co giãn theo cạnh ngắn của ảnh.
function drawStamp(ctx, W, H, { time, pos, location, club, teacher, code, distance }) {
  const u = Math.min(W, H) / 300;
  const B = H; // mép dưới
  const grad = ctx.createLinearGradient(0, B - 150 * u, 0, B);
  grad.addColorStop(0, "rgba(2,6,23,0)");
  grad.addColorStop(1, "rgba(2,6,23,0.8)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, B - 150 * u, W, 150 * u);

  ctx.save();
  ctx.shadowColor = "rgba(2,6,23,0.65)";
  ctx.shadowBlur = 3 * u;
  ctx.shadowOffsetY = 0.6 * u;
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#F9DD0E";
  ctx.fillRect(14 * u, B - 114 * u, 4.5 * u, 40 * u);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `800 ${42 * u}px ${FONT}`;
  const hm = fmtHm(time);
  ctx.fillText(hm, 25 * u, B - 77 * u);
  const x2 = 25 * u + ctx.measureText(hm).width + 10 * u;
  ctx.font = `700 ${12.5 * u}px ${FONT}`;
  ctx.fillText(fmtDate(time), x2, B - 97 * u);
  ctx.fillStyle = "#FEF3B0";
  ctx.font = `600 ${12 * u}px ${FONT}`;
  ctx.fillText(`${DOW_WORD[time.getDay()]} · ${pad(time.getSeconds())} giây`, x2, B - 80 * u);

  const maxW = W - 46 * u;
  ctx.save();
  ctx.translate(22 * u, B - 59 * u);
  ctx.scale(0.78 * u, 0.78 * u);
  ctx.fillStyle = "#F43F5E";
  ctx.fill(PIN);
  ctx.restore();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${10.5 * u}px ${FONT}`;
  ctx.fillText(fitText(ctx, location.name, maxW), 32 * u, B - 56 * u);
  ctx.fillStyle = "#E2E8F0";
  ctx.font = `500 ${10 * u}px ${FONT}`;
  ctx.fillText(fitText(ctx, location.address, maxW), 32 * u, B - 42 * u);

  const inside = pos && distance !== null && distance <= location.radius;
  ctx.fillStyle = !pos ? "#FCD34D" : inside ? "#86EFAC" : "#FCD34D";
  ctx.font = `500 ${9.5 * u}px ${MONO}`;
  const coordLine = pos
    ? `${fmtCoord(pos)} · ±${pos.acc} m${inside ? "" : ` · ngoài khuôn viên ${Math.round(distance)} m`}`
    : "Không lấy được vị trí GPS";
  ctx.fillText(fitText(ctx, coordLine, maxW), 32 * u, B - 28 * u);

  ctx.fillStyle = "#FEF3B0";
  ctx.font = `600 ${10 * u}px ${FONT}`;
  ctx.fillText(fitText(ctx, `CLB ${club.name} · ${teacher}`, W - 30 * u), 16 * u, B - 11 * u);
  ctx.restore();

  // Nhãn "Ảnh thật" + mã xác thực ở góc trên phải
  const bw = 112 * u;
  const bx = W - bw - 10 * u;
  const by = 10 * u;
  ctx.fillStyle = "rgba(2,6,23,0.62)";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, 34 * u, 4 * u);
  else ctx.rect(bx, by, bw, 34 * u);
  ctx.fill();
  ctx.fillStyle = "#10B981";
  ctx.beginPath();
  ctx.arc(bx + 13 * u, by + 11 * u, 6.5 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.8 * u;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(bx + 10 * u, by + 11.2 * u);
  ctx.lineTo(bx + 12.1 * u, by + 13.3 * u);
  ctx.lineTo(bx + 16 * u, by + 9 * u);
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${9.5 * u}px ${FONT}`;
  ctx.fillText("ẢNH THẬT · FITNESSGRAM", bx + 24 * u, by + 15 * u, bw - 28 * u);
  ctx.fillStyle = "#CBD5E1";
  ctx.font = `500 ${9 * u}px ${MONO}`;
  ctx.fillText(code, bx + 10 * u, by + 28 * u);
}

// Nhận file từ camera → ảnh JPEG đã đóng dấu (tối đa 1600px cạnh dài)
export async function stampPhoto(file, data) {
  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`800 40px ${FONT}`, "0123456789:"),
      document.fonts.load(`700 12px ${FONT}`, "Trường Việt Anh ẢNH THẬT"),
      document.fonts.load(`500 12px ${FONT}`, "Phan Huy Ích Hội Tây"),
    ]).catch(() => {});
  }
  const bmp = await loadBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const W = Math.round(bmp.width * scale);
  const H = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bmp, 0, 0, W, H);
  if (bmp.close) bmp.close();
  drawStamp(ctx, W, H, data);
  const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Không xử lý được ảnh"))), "image/jpeg", 0.86));
  return { blob, url: URL.createObjectURL(blob), width: W, height: H };
}
