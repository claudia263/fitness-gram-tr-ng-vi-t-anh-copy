import { computeZScore, nutritionalStatusFromZScore } from './whoReference.js';
import { pacerLevelFromLaps } from './pacerReference.js';

// Nhập dữ liệu thể lực từ file Excel (mỗi sheet là một lớp). Chạy trong trình duyệt của quản trị viên.
// opts: { campus, school_year, session_name, test_date, semester, notes }
export async function importFitnessExcel(file, opts = {}, entities) {
  const base44 = { entities };
  const XLSX = await import('xlsx');
  const campus = opts.campus || 'CS GVP';
  const schoolYear = opts.school_year || '2026–2027';
  const sessionName = opts.session_name || 'Kiểm tra Fitness CS GVP 2026';
  const testDate = opts.test_date || '2026-06-01';
  const semester = opts.semester || 'Học kỳ II';
  const notes = opts.notes || 'Import tự động từ file Excel';

  // 1. Đọc workbook
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: false });

  // 2. Create (or reuse) one TestSession for this import
  const existingSessions = await base44.entities.TestSession.filter({ name: sessionName });
  let sessionId;
  if (existingSessions && existingSessions.length > 0) {
    sessionId = existingSessions[0].id;
  } else {
    const session = await base44.entities.TestSession.create({
      name: sessionName,
      test_date: testDate,
      semester,
      school_year: schoolYear,
      notes,
    });
    sessionId = session.id;
  }

  // 3. Load existing classes + students (upsert — không bỏ qua học sinh đã tồn tại)
  const existingClasses = await base44.entities.Class.list(null, 5000);
  const classMap = new Map(); // "sheetName|schoolYear" -> classId
  for (const c of existingClasses) {
    classMap.set(`${c.name}|${c.school_year}`, c.id);
  }
  const existingStudents = await base44.entities.Student.list(null, 20000);
  const studentMap = new Map(); // normKey(name,classId) -> studentId
  for (const s of existingStudents) {
    studentMap.set(normKey(s.full_name, s.class_id), s.id);
  }

  // Load existing fitness + anthro for this session (to upsert, not duplicate)
  const existingFitness = await base44.entities.FitnessResult.filter({ session_id: sessionId }, null, 20000);
  const fitnessByStudent = new Map();
  for (const f of existingFitness) fitnessByStudent.set(f.student_id, f);
  const existingAnthro = await base44.entities.AnthropometricResult.filter({ session_id: sessionId }, null, 20000);
  const anthroByStudent = new Map();
  for (const a of existingAnthro) anthroByStudent.set(a.student_id, a);

  const studentsToCreate = []; // {full_name, sex, birth_date, class_id, grade, campus, school_year, _key}
  const rowRecords = []; // parsed rows awaiting student_id resolution
  let existingStudentCount = 0;
  let noDataCount = 0;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    if (!rows || rows.length < 2) continue;

    const header = rows[0];
    const col = (name) => header.findIndex((h) => String(h || '').includes(name));

    // "Tên" khớp cả "Tên học sinh" và "Họ Tên" (sheet 4OIC)
    const iName = col('Tên');
    const iSex = col('Giới tính');
    const iBirth = col('Ngày sinh');
    const iHeight = col('Chiều Cao');
    const iWeight = col('Cân nặng');
    const iPacer = col('Pacer');
    const iSitReach = col('Sit and Reach');
    const iPushup = col('Push-up');
    const iPlank = col('Plank');
    // Bài test Bộ GD&ĐT (QĐ 53): chỉ ghi các cột có trong sheet
    const moetCols = MOET_COLUMNS.map((m) => ({ ...m, i: header.findIndex((h) => m.match.test(plain(h))) })).filter((m) => m.i >= 0);
    if (iName < 0) continue;

    const cleanSheet = String(sheetName).trim();
    const grade = (cleanSheet.match(/^[0-9]+/) || ['0'])[0];

    // Ensure class exists
    let classId = classMap.get(`${cleanSheet}|${schoolYear}`);
    if (!classId) {
      const created = await base44.entities.Class.create({
        name: cleanSheet,
        grade,
        campus,
        school_year: schoolYear,
      });
      classId = created.id;
      classMap.set(`${cleanSheet}|${schoolYear}`, classId);
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = row[iName] ? String(row[iName]).trim() : '';
      if (!name) continue;

      const sexRaw = row[iSex] ? String(row[iSex]).trim().toLowerCase() : '';
      const sex = sexRaw.includes('ữ') ? 'female' : 'male';
      const birthDate = parseBirthDate(row[iBirth], grade);

      const key = normKey(name, classId);
      let studentId = studentMap.get(key);
      const isNew = !studentId;
      if (isNew) {
        studentsToCreate.push({
          full_name: name,
          sex,
          birth_date: birthDate,
          class_id: classId,
          grade,
          campus,
          school_year: schoolYear,
          _key: key,
        });
      } else {
        existingStudentCount++;
      }

      const height = num(row[iHeight]);
      const weight = num(row[iWeight]);
      const sitReach = num(row[iSitReach]);
      const pushup = num(row[iPushup]);
      const plank = num(row[iPlank]);
      const pacer = parsePacer(row[iPacer]);
      const moet = Object.fromEntries(moetCols.map((m) => [m.field, num(String(row[m.i] ?? '').replace(',', '.').trim())]));

      // PACER: tổng lượt (shuttles) → level tự tính từ bảng 15m PACER
      const pacerLaps = pacer.laps;
      const pacerLevel = pacerLaps != null ? pacerLevelFromLaps(pacerLaps) : pacer.level;

      const hasFitness = [pacerLaps, pacerLevel, sitReach, pushup, plank, ...Object.values(moet)].some((v) => v != null);
      if (!hasFitness && height == null && weight == null) noDataCount++;

      rowRecords.push({
        key,
        studentId,
        isNew,
        pacerLaps,
        pacerLevel,
        sitReach,
        pushup,
        plank,
        moet,
        height,
        weight,
        sex,
        birthDate,
        hasFitness,
      });
    }
  }

  const BATCH = 100;
  const idMap = new Map();
  let totalStudents = 0;

  // 4. Bulk create NEW students
  if (studentsToCreate.length > 0) {
    const studentPayload = studentsToCreate.map(({ _key, ...rest }) => rest);
    for (let i = 0; i < studentPayload.length; i += BATCH) {
      const slice = studentPayload.slice(i, i + BATCH);
      const keys = studentsToCreate.slice(i, i + BATCH).map((s) => s._key);
      const created = await base44.entities.Student.bulkCreate(slice);
      created.forEach((s, idx) => {
        idMap.set(keys[idx], s.id);
      });
      totalStudents += created.length;
    }
  }

  // Resolve studentId for new rows
  for (const r of rowRecords) {
    if (r.isNew && !r.studentId) r.studentId = idMap.get(r.key);
  }

  // 5. Build fitness + anthro create/update lists (upsert per student+session)
  const fitnessCreate = [];
  const fitnessUpdate = [];
  const anthroCreate = [];
  const anthroUpdate = [];

  for (const r of rowRecords) {
    if (!r.studentId) continue;

    if (r.hasFitness) {
      const data = {
        pacer_level: r.pacerLevel,
        pacer_laps: r.pacerLaps,
        sit_and_reach_cm: r.sitReach,
        pushup_count: r.pushup,
        plank_seconds: r.plank,
        ...r.moet,
      };
      const existing = fitnessByStudent.get(r.studentId);
      if (existing) {
        fitnessUpdate.push({ id: existing.id, ...data });
      } else {
        fitnessCreate.push({ student_id: r.studentId, session_id: sessionId, ...data });
      }
    }

    if (r.height != null && r.weight != null && r.height > 0 && r.weight > 0) {
      const bmi = Math.round((r.weight / Math.pow(r.height / 100, 2)) * 100) / 100;
      const ageMonths = calcAgeMonths(r.birthDate, testDate);
      const zScore = computeZScore(r.sex, ageMonths, bmi);
      const nutritionalStatus = nutritionalStatusFromZScore(zScore);
      const anthroData = {
        height_cm: r.height,
        weight_kg: r.weight,
        bmi,
        age_months: ageMonths,
        bmi_for_age_zscore: zScore != null ? Math.round(zScore * 100) / 100 : null,
        nutritional_status: nutritionalStatus,
      };
      const existing = anthroByStudent.get(r.studentId);
      if (existing) {
        anthroUpdate.push({ id: existing.id, ...anthroData });
      } else {
        anthroCreate.push({ student_id: r.studentId, session_id: sessionId, ...anthroData });
      }
    }
  }

  // 6. Execute bulk create + bulk update (batched)
  let fitnessCreated = 0, fitnessUpdated = 0, anthroCreated = 0, anthroUpdated = 0;
  for (let i = 0; i < fitnessCreate.length; i += BATCH) {
    const created = await base44.entities.FitnessResult.bulkCreate(fitnessCreate.slice(i, i + BATCH));
    fitnessCreated += created.length;
  }
  for (let i = 0; i < fitnessUpdate.length; i += BATCH) {
    const updated = await base44.entities.FitnessResult.bulkUpdate(fitnessUpdate.slice(i, i + BATCH));
    fitnessUpdated += updated.length;
  }
  for (let i = 0; i < anthroCreate.length; i += BATCH) {
    const created = await base44.entities.AnthropometricResult.bulkCreate(anthroCreate.slice(i, i + BATCH));
    anthroCreated += created.length;
  }
  for (let i = 0; i < anthroUpdate.length; i += BATCH) {
    const updated = await base44.entities.AnthropometricResult.bulkUpdate(anthroUpdate.slice(i, i + BATCH));
    anthroUpdated += updated.length;
  }


  return {
    students: totalStudents + existingStudentCount,
    fitness: fitnessCreated + fitnessUpdated,
    anthropometric: anthroCreated + anthroUpdated,
    skipped: noDataCount,
    students_new: totalStudents,
    students_existing: existingStudentCount,
    fitness_new: fitnessCreated,
    fitness_updated: fitnessUpdated,
    anthropometric_new: anthroCreated,
    anthropometric_updated: anthroUpdated,
    session_id: sessionId,
  };
}

// Cột bài test Bộ GD&ĐT, nhận theo tên (không dấu): "Bật xa tại chỗ (cm)", "Chạy 30m XPC", "Chạy tùy sức 5 phút"...
const MOET_COLUMNS = [
  { field: 'long_jump_cm', match: /bat xa/ },
  { field: 'run_5min_m', match: /tuy suc|5 ?phut/ },
  { field: 'situps_30s', match: /gap bung|nam ngua/ },
  { field: 'sprint_30m_s', match: /chay 30 ?m|^30 ?m/ },
  { field: 'grip_strength_kg', match: /bop tay/ },
  { field: 'shuttle_4x10_s', match: /con thoi|4 ?x ?10/ },
];
const plain = (h) =>
  String(h || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// Chuẩn hóa key học sinh: tên (trim + collapse spaces) + classId để khớp trùng.
function normKey(name, classId) {
  const n = String(name || '').trim().replace(/\s+/g, ' ');
  return `${n}|${classId}`;
}

function parseBirthDate(v, grade) {
  // Ô ngày của Excel là số serial (không dùng cellDates để khỏi lệch múi giờ)
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    return new Date(Math.round((Math.floor(v) - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  if (v == null || v === '') {
    // estimate from grade: grade 6 -> 2015, grade 12 -> 2009
    const g = parseInt(grade) || 6;
    const year = 2026 - (g + 5);
    return `${year}-01-01`;
  }
  const s = String(v).trim();
  // dd/mm/yyyy
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) {
    const iso = `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso) return iso;
    // Ngày/tháng không hợp lệ (vd 00/00/2014): giữ năm nếu hợp lý, không thì ước tính theo khối
    if (Number(m1[3]) >= 1990) return `${m1[3]}-01-01`;
    const g = parseInt(grade) || 6;
    return `${2026 - (g + 5)}-01-01`;
  }
  // yyyy-mm-dd
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const g = parseInt(grade) || 6;
  const year = 2026 - (g + 5);
  return `${year}-01-01`;
}

// Parse cột PACER thành tổng số lượt (shuttles).
// - Số nguyên (vd 61) → tổng lượt = 61.
// - Dạng "level.laps" (vd 7.3 = level 7, 3 lượt trong level) → quy ra tổng lượt
//   = cumShuttles(level-1) + laps.
function parsePacer(v) {
  if (v == null || v === '') return { level: null, laps: null };
  if (v instanceof Date) return { level: null, laps: null };
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return { level: null, laps: null };

  // Dạng "level.laps" hoặc "level,laps" (có phần thập phân)
  const m = s.match(/^(\d+)[\-,\.](\d+)$/);
  if (m) {
    const lvl = Number(m[1]);
    const lapsInLevel = Number(m[2]);
    const prev = PACER_15M_CUM[lvl - 1] || 0;
    return { level: lvl, laps: prev + lapsInLevel };
  }
  const n = typeof v === 'number' ? v : Number(s);
  if (!isNaN(n)) {
    if (Number.isInteger(n)) return { level: null, laps: n }; // tổng lượt
    // số thập phân → level.laps
    const lvl = Math.floor(n);
    const lapsInLevel = Math.round((n - lvl) * 10);
    const prev = PACER_15M_CUM[lvl - 1] || 0;
    return { level: lvl, laps: prev + lapsInLevel };
  }
  return { level: null, laps: null };
}

// cumShuttles tại hết level L → PACER_15M_CUM[L] = tổng lượt sau level L
const PACER_15M_CUM = [7,15,23,32,41,51,61,72,83,94,106,118,131,144,157,171,185,200,215,231,247];

function calcAgeMonths(birthDate, testDate) {
  if (!birthDate || !testDate) return null;
  const b = new Date(birthDate);
  const t = new Date(testDate);
  if (isNaN(b.getTime()) || isNaN(t.getTime())) return null;
  let months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  if (t.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}