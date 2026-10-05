import { connectToDatabase } from '../_lib/mongodb.js';
import Lead from '../_lib/Lead.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const {
        status,
        q,
        limit = '100',
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query || {};

      const filter = {};
      if (status && ['new', 'contacted', 'closed'].includes(status)) {
        filter.status = status;
      }
      if (q && String(q).trim()) {
        const rx = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { firstName: rx },
          { lastName: rx },
          { email: rx },
          { company: rx },
          { message: rx },
        ];
      }

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) {
          const start = new Date(String(dateFrom));
          if (!Number.isNaN(start.getTime())) {
            start.setHours(0, 0, 0, 0);
            filter.createdAt.$gte = start;
          }
        }
        if (dateTo) {
          const end = new Date(String(dateTo));
          if (!Number.isNaN(end.getTime())) {
            end.setHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
          }
        }
        if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
      }

      const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'company', 'status'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sortDir = sortOrder === 'asc' ? 1 : -1;

      const docs = await Lead.find(filter)
        .sort({ [sortField]: sortDir })
        .limit(Math.min(parseInt(limit, 10) || 100, 500))
        .lean();

      const stats = {
        total: await Lead.countDocuments({}),
        new: await Lead.countDocuments({ status: 'new' }),
        contacted: await Lead.countDocuments({ status: 'contacted' }),
        closed: await Lead.countDocuments({ status: 'closed' }),
        filtered: await Lead.countDocuments(filter),
      };

      return res.status(200).json({ ok: true, leads: docs, stats });
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { id, status } = body;
      if (!id || !['new', 'contacted', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'id and a valid status are required.' });
      }
      const updated = await Lead.findByIdAndUpdate(id, { status }, { new: true }).lean();
      if (!updated) return res.status(404).json({ error: 'Lead not found.' });
      return res.status(200).json({ ok: true, lead: updated });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id is required.' });
      const deleted = await Lead.findByIdAndDelete(id).lean();
      if (!deleted) return res.status(404).json({ error: 'Lead not found.' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('admin/leads failed:', err);
    return res.status(500).json({ error: 'Request failed.' });
  }
}
