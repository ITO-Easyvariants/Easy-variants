import { requireAdmin } from '../_lib/auth.js';
import { CMS_SCHEMA } from '../_lib/cmsSchema.js';

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(200).json({ ok: true, schema: CMS_SCHEMA });
}
