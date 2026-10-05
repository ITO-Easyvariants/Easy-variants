import { requireAdmin } from '../_lib/auth.js';
import {
  handleMediaUpload,
  prepareMediaUpload,
  finalizeMediaUpload,
  isMultipartRequest,
} from '../_lib/mediaUpload.js';

async function ensureJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    req.body = {};
    return req.body;
  }
  try {
    req.body = JSON.parse(raw);
  } catch {
    const err = new Error('Invalid JSON body.');
    err.statusCode = 400;
    throw err;
  }
  return req.body;
}

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    if (isMultipartRequest(req)) {
      const result = await handleMediaUpload(req);
      return res.status(200).json(result);
    }

    const body = await ensureJsonBody(req);
    const action = String(body.action || '').toLowerCase();

    if (action === 'prepare') {
      const result = await prepareMediaUpload(req);
      return res.status(200).json(result);
    }
    if (action === 'finalize') {
      const result = await finalizeMediaUpload(req);
      return res.status(200).json(result);
    }

    return res.status(400).json({
      error: 'Unknown action. Use action "prepare" or "finalize", or send multipart/form-data.',
    });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error('POST /api/admin/media failed:', err);
    return res.status(status).json({ error: err.message || 'Upload failed.' });
  }
}

/** Vercel / dev-server: do not parse body before this handler runs (multipart needs raw stream). */
export const config = {
  api: {
    bodyParser: false,
  },
};
