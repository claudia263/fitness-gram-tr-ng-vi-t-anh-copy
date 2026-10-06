// Entities cho các bảng Supabase (API giống Base44 SDK: list/filter/get/create/update/delete...).
const TABLES = {
  Student: 'students',
  Class: 'classes',
  Teacher: 'teachers',
  Parent: 'parents',
  ParentStudentRelationship: 'parent_student_relationships',
  TestSession: 'test_sessions',
  FitnessResult: 'fitness_results',
  AnthropometricResult: 'anthropometric_results',
  TeacherComment: 'teacher_comments',
  WhoBmiReference: 'who_bmi_references',
};

const PAGE = 1000; // giới hạn số dòng mỗi request của PostgREST
const IN_CHUNK = 100; // chia nhỏ $in để URL không quá dài

function applySort(q, sort) {
  const field = sort ? (sort.startsWith('-') ? sort.slice(1) : sort) : 'created_date';
  const ascending = !(sort && sort.startsWith('-'));
  return q.order(field, { ascending });
}

function applyFilter(q, filter) {
  for (const [key, value] of Object.entries(filter || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && '$in' in value) {
      q = q.in(key, value.$in);
    } else {
      q = q.eq(key, value);
    }
  }
  return q;
}

const fail = (error) => {
  throw Object.assign(new Error(error.message), { status: error.status, code: error.code, data: error });
};

// Chạy query (có phân trang) cho một filter không chứa $in quá dài.
async function fetchRows(supabase, table, filter, sort, limit) {
  const want = limit ?? 50;
  const rows = [];
  for (let from = 0; rows.length < want; from += PAGE) {
    const size = Math.min(PAGE, want - rows.length);
    const q = applySort(applyFilter(supabase.from(table).select('*'), filter), sort).range(from, from + size - 1);
    const { data, error } = await q;
    if (error) fail(error);
    rows.push(...data);
    if (data.length < size) break;
  }
  return rows;
}

async function query(supabase, table, filter, sort, limit) {
  // Tách $in dài thành nhiều request rồi gộp lại.
  const inKey = Object.keys(filter || {}).find(
    (k) => filter[k] && typeof filter[k] === 'object' && Array.isArray(filter[k].$in) && filter[k].$in.length > IN_CHUNK
  );
  if (!inKey) return fetchRows(supabase, table, filter, sort, limit);

  const ids = filter[inKey].$in;
  const merged = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const part = await fetchRows(supabase, table, { ...filter, [inKey]: { $in: ids.slice(i, i + IN_CHUNK) } }, sort, limit);
    merged.push(...part);
  }
  if (sort) {
    const field = sort.startsWith('-') ? sort.slice(1) : sort;
    const dir = sort.startsWith('-') ? -1 : 1;
    merged.sort((a, b) => (a[field] > b[field] ? dir : a[field] < b[field] ? -dir : 0));
  }
  return limit != null ? merged.slice(0, limit) : merged;
}

function makeEntity(supabase, table) {
  return {
    list: (sort, limit) => query(supabase, table, {}, sort, limit),
    filter: (filter, sort, limit) => query(supabase, table, filter, sort, limit),
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) fail(error);
      return data;
    },
    async create(row) {
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) fail(error);
      return data;
    },
    async bulkCreate(rows) {
      const { data, error } = await supabase.from(table).insert(rows).select();
      if (error) fail(error);
      return data;
    },
    async update(id, patch) {
      const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single();
      if (error) fail(error);
      return data;
    },
    // rows: [{ id, ...fields }]
    async bulkUpdate(rows) {
      const out = [];
      for (const { id, ...patch } of rows) {
        const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single();
        if (error) fail(error);
        out.push(data);
      }
      return out;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) fail(error);
      return { success: true };
    },
    async deleteMany(filter) {
      const { error } = await applyFilter(supabase.from(table).delete(), filter);
      if (error) fail(error);
      return { success: true };
    },
  };
}



export function createEntities(supabase) {
  return Object.fromEntries(Object.entries(TABLES).map(([name, table]) => [name, makeEntity(supabase, table)]));
}
