// Truy cập dữ liệu CLB trên Supabase (bảng clubs, club_slots, evidence_*, kho ảnh "evidence").
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/base44Client";
import { WEEK_ORDER, ymd } from "@/lib/clubs/model";

const BUCKET = "evidence";
const fail = (error) => {
  throw Object.assign(new Error(error.message), { code: error.code, status: error.status });
};
const hm = (t) => String(t || "").slice(0, 5);

function toClub(row) {
  const slots = (row.club_slots || [])
    .map((s) => ({ id: s.id, dow: s.dow, start: hm(s.start_time), end: hm(s.end_time), place: s.place }))
    .sort((a, b) => WEEK_ORDER.indexOf(a.dow) - WEEK_ORDER.indexOf(b.dow));
  const { club_slots: _omit, ...rest } = row;
  return { ...rest, levels: row.levels || [], slots };
}

/* ------------------------------ đọc ------------------------------ */
export async function fetchClubs() {
  const { data, error } = await supabase.from("clubs").select("*, club_slots(*)").order("created_date");
  if (error) fail(error);
  return data.map(toClub);
}

export async function fetchStaff() {
  const { data, error } = await supabase.from("profiles").select("id, email, full_name, role").neq("role", "user").order("full_name");
  if (error) fail(error);
  return data;
}

export async function fetchSchoolLocation() {
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", "school_location").maybeSingle();
  if (error) fail(error);
  return data?.value || null;
}

// Buổi minh chứng (kèm ảnh) trong khoảng ngày [from, to]
export async function fetchEvidence({ from, to, clubId } = {}) {
  const rows = [];
  for (let start = 0; ; start += 1000) {
    let q = supabase.from("evidence_sessions").select("*, evidence_photos(*)").order("session_date", { ascending: false });
    if (from) q = q.gte("session_date", from);
    if (to) q = q.lte("session_date", to);
    if (clubId) q = q.eq("club_id", clubId);
    const { data, error } = await q.range(start, start + 999);
    if (error) fail(error);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows.map((s) => ({
    ...s,
    photos: (s.evidence_photos || []).sort((a, b) => a.taken_at.localeCompare(b.taken_at)),
  }));
}

export async function findPhotoByCode(code) {
  const { data, error } = await supabase.from("evidence_photos").select("*, evidence_sessions(status, session_date)").eq("code", code).maybeSingle();
  if (error) fail(error);
  return data;
}

/* ------------------------------ ghi ------------------------------ */
export async function saveClub(id, fields, slots) {
  let clubId = id;
  if (id) {
    const { error } = await supabase.from("clubs").update(fields).eq("id", id);
    if (error) fail(error);
  } else {
    const { data, error } = await supabase.from("clubs").insert({ ...fields, source: "manual" }).select("id").single();
    if (error) fail(error);
    clubId = data.id;
  }
  const { error: delError } = await supabase.from("club_slots").delete().eq("club_id", clubId);
  if (delError) fail(delError);
  if (slots.length) {
    const { error } = await supabase
      .from("club_slots")
      .insert(slots.map((s) => ({ club_id: clubId, dow: Number(s.dow), start_time: s.start, end_time: s.end, place: s.place.trim() })));
    if (error) fail(error);
  }
  return clubId;
}

export async function deleteClub(id) {
  const { error } = await supabase.from("clubs").delete().eq("id", id);
  if (error) fail(error);
}

// Tải ảnh đã đóng dấu lên kho rồi ghi nhận (máy chủ ghi giờ nhận ảnh và tính khoảng cách tới trường)
export async function uploadEvidence({ clubId, blob, code, deviceTime, pos }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại.");
  const path = `${auth.user.id}/${clubId}/${ymd(deviceTime)}/${code}.jpg`;
  const { error: upError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (upError) fail(upError);
  const { data, error } = await supabase.rpc("submit_evidence", {
    p_club: clubId,
    p_path: path,
    p_code: code,
    p_device_time: deviceTime.toISOString(),
    p_lat: pos?.lat ?? null,
    p_lon: pos?.lon ?? null,
    p_accuracy: pos?.acc ?? null,
  });
  if (error) fail(error);
  return data;
}

export async function reviewSession(id, status, reason = null) {
  const { data: auth } = await supabase.auth.getUser();
  const patch =
    status === "pending"
      ? { status, reason: null, reviewed_by: null, reviewed_at: null }
      : { status, reason, reviewed_by: auth?.user?.id ?? null, reviewed_at: new Date().toISOString() };
  const { error } = await supabase.from("evidence_sessions").update(patch).in("id", Array.isArray(id) ? id : [id]);
  if (error) fail(error);
}

/* ------------------------------ hooks ------------------------------ */
export function useClubData() {
  const clubs = useQuery({ queryKey: ["clubs"], queryFn: fetchClubs });
  const staff = useQuery({ queryKey: ["staff"], queryFn: fetchStaff, staleTime: 5 * 60 * 1000 });
  const location = useQuery({ queryKey: ["school-location"], queryFn: fetchSchoolLocation, staleTime: 30 * 60 * 1000 });
  const staffById = useMemo(() => Object.fromEntries((staff.data || []).map((p) => [p.id, p])), [staff.data]);
  const clubById = useMemo(() => Object.fromEntries((clubs.data || []).map((c) => [c.id, c])), [clubs.data]);
  return {
    clubs: clubs.data || [],
    clubById,
    staff: staff.data || [],
    staffById,
    location: location.data,
    loading: clubs.isLoading,
    error: clubs.error,
  };
}

export function useEvidence(range) {
  return useQuery({ queryKey: ["evidence", range.from, range.to, range.clubId || null], queryFn: () => fetchEvidence(range) });
}

export function useInvalidateClubs() {
  const qc = useQueryClient();
  return (what = ["clubs", "evidence"]) => Promise.all(what.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

// Link tạm (1 giờ) để xem ảnh trong kho riêng tư; nhớ lại để không xin lại liên tục
const urlCache = new Map();
export function useSignedUrls(paths) {
  const key = paths.join("|");
  const [urls, setUrls] = useState(() => Object.fromEntries(paths.filter((p) => urlCache.has(p)).map((p) => [p, urlCache.get(p).url])));
  useEffect(() => {
    let alive = true;
    const now = Date.now();
    const missing = paths.filter((p) => !urlCache.has(p) || urlCache.get(p).exp < now);
    const known = Object.fromEntries(paths.filter((p) => urlCache.has(p)).map((p) => [p, urlCache.get(p).url]));
    if (!missing.length) {
      setUrls(known);
      return undefined;
    }
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(missing, 3600)
      .then(({ data }) => {
        (data || []).forEach((d) => d.signedUrl && urlCache.set(d.path, { url: d.signedUrl, exp: now + 50 * 60 * 1000 }));
        if (alive) setUrls(Object.fromEntries(paths.filter((p) => urlCache.has(p)).map((p) => [p, urlCache.get(p).url])));
      });
    return () => {
      alive = false;
    };
  }, [key]);
  return urls;
}
