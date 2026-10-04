import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { WHO_BOYS, WHO_GIRLS } from '../../shared/whoReference.ts';

// Seed the WhoBmiReference entity with WHO 2007 BMI-for-age reference data.
// Admin-only: call from AdminDashboard to populate reference tables.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Check if already seeded
    const existing = await base44.entities.WhoBmiReference.list(null, 1);
    if (existing.length > 0) {
      return Response.json({ ok: true, message: 'WHO reference data already seeded', count: existing.length });
    }

    const records = [];
    for (const row of WHO_BOYS) {
      records.push({
        sex: 'male',
        age_months: row[0],
        M: row[4],
        sd_minus3: row[1],
        sd_minus2: row[2],
        sd_minus1: row[3],
        sd_plus1: row[5],
        sd_plus2: row[6],
        sd_plus3: row[7],
        source: 'WHO Reference 2007 — BMI-for-age (boys)',
        version: '2007',
      });
    }
    for (const row of WHO_GIRLS) {
      records.push({
        sex: 'female',
        age_months: row[0],
        M: row[4],
        sd_minus3: row[1],
        sd_minus2: row[2],
        sd_minus1: row[3],
        sd_plus1: row[5],
        sd_plus2: row[6],
        sd_plus3: row[7],
        source: 'WHO Reference 2007 — BMI-for-age (girls)',
        version: '2007',
      });
    }

    const BATCH = 100;
    let created = 0;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const res = await base44.entities.WhoBmiReference.bulkCreate(batch);
      created += res.length;
    }

    return Response.json({ ok: true, message: 'WHO reference data seeded', count: created });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}