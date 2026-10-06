// Nhập file Excel thể lực vào Supabase từ máy local.
//   node scripts/import-excel.mjs <file.xlsx> [--dry]
// Biến môi trường (đặt trong shell, KHÔNG ghi vào file):
//   SUPABASE_URL, SUPABASE_SERVICE_KEY
// Tuỳ chọn: IMPORT_CAMPUS, IMPORT_SCHOOL_YEAR, IMPORT_SESSION_NAME, IMPORT_TEST_DATE, IMPORT_SEMESTER, IMPORT_NOTES
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createEntities } from '../src/api/entities.js';
import { importFitnessExcel } from '../src/lib/importFitnessExcel.js';

const file = process.argv[2];
const dry = process.argv.includes('--dry');
if (!file) {
  console.error('Cách dùng: node scripts/import-excel.mjs <file.xlsx> [--dry]');
  process.exit(1);
}

// Bộ nhớ giả để chạy thử, không đụng database.
function memoryEntities() {
  const tables = {};
  let n = 0;
  const t = (name) => (tables[name] ??= []);
  const match = (row, f) => Object.entries(f || {}).every(([k, v]) => (v && v.$in ? v.$in.includes(row[k]) : row[k] === v));
  const make = (name) => ({
    list: async () => [...t(name)],
    filter: async (f) => t(name).filter((r) => match(r, f)),
    create: async (r) => { const x = { id: `m${++n}`, ...r }; t(name).push(x); return x; },
    bulkCreate: async (rows) => rows.map((r) => { const x = { id: `m${++n}`, ...r }; t(name).push(x); return x; }),
    bulkUpdate: async (rows) => rows,
  });
  const e = Object.fromEntries(['Student', 'Class', 'TestSession', 'FitnessResult', 'AnthropometricResult'].map((k) => [k, make(k)]));
  e._tables = tables;
  return e;
}

let entities;
if (dry) {
  entities = memoryEntities();
} else {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_KEY.');
    process.exit(1);
  }
  entities = createEntities(createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } }));
}

const buf = fs.readFileSync(file);
const blob = { arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
const env = process.env;
const res = await importFitnessExcel(
  blob,
  {
    campus: env.IMPORT_CAMPUS,
    school_year: env.IMPORT_SCHOOL_YEAR,
    session_name: env.IMPORT_SESSION_NAME,
    test_date: env.IMPORT_TEST_DATE,
    semester: env.IMPORT_SEMESTER,
    notes: env.IMPORT_NOTES,
  },
  entities
);
console.log(dry ? '[DRY RUN — chưa ghi gì]' : '[ĐÃ GHI VÀO SUPABASE]', res);
if (dry) {
  const s = entities._tables;
  console.log('Lớp:', s.Class.length, '| Mẫu học sinh:', s.Student.slice(0, 3).map((x) => `${x.full_name} ${x.birth_date} ${x.sex} ${x.grade}`));
  console.log('Mẫu thể trạng:', s.AnthropometricResult.slice(0, 2));
  console.log('Mẫu thể lực:', s.FitnessResult.slice(0, 3));
}
