import { connectToDatabase } from '../_lib/mongodb.js';
import ContentAudit from '../_lib/ContentAudit.js';
import { requireAdmin } from '../_lib/auth.js';
import { formatAuditEntry } from '../_lib/auditUtils.js';

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    await connectToDatabase();

    const limit = Math.min(Number(req.query?.limit) || 30, 100);
    const filter = {};

    const page = String(req.query?.page || '')
      .trim()
      .toLowerCase();

    if (page) {
      if (!/^[a-z0-9-]+$/.test(page)) {
        return res.status(400).json({ error: 'Invalid page identifier.' });
      }
      filter.pageKey = page;
    }

    const rows = await ContentAudit.find(filter).sort({ at: -1 }).limit(limit).lean();

    return res.status(200).json({
      ok: true,
      entries: rows.map(formatAuditEntry),
    });
  } catch (err) {
    console.error('admin/content-audit failed:', err);
    return res.status(500).json({ error: 'Request failed.' });
  }
}
