import { connectToDatabase } from '../_lib/mongodb.js';
import Content from '../_lib/Content.js';
import ContentRevision from '../_lib/ContentRevision.js';
import { requireAdmin } from '../_lib/auth.js';
import { serializeBlocks, validateBlocksForPage, contentMeta } from '../_lib/contentUtils.js';
import { saveRevisionSnapshot, formatRevision } from '../_lib/revisionUtils.js';
import { logContentAudit } from '../_lib/auditUtils.js';
import { encodeBlocks } from '../_lib/blockKeyUtils.js';

function normalizePage(raw) {
  const page = String(raw || '')
    .trim()
    .toLowerCase();
  if (!page || !/^[a-z0-9-]+$/.test(page)) {
    return { ok: false, error: 'Invalid page identifier.' };
  }
  return { ok: true, page };
}

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const parsed = normalizePage(req.query?.page);
      if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
      }

      const { page } = parsed;
      const limit = Math.min(Number(req.query?.limit) || 15, 50);

      const rows = await ContentRevision.find({ pageKey: page })
        .sort({ savedAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({
        ok: true,
        pageKey: page,
        revisions: rows.map(formatRevision),
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const revisionId = String(body.revisionId || '').trim();

      if (!revisionId) {
        return res.status(400).json({ error: 'revisionId is required.' });
      }

      const revision = await ContentRevision.findById(revisionId).lean();
      if (!revision) {
        return res.status(404).json({ error: 'Revision not found.' });
      }

      const parsed = normalizePage(body.page || revision.logicalPage);
      if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
      }

      const { page } = parsed;
      if (revision.pageKey !== page) {
        return res.status(400).json({ error: 'Revision does not match the selected page.' });
      }

      const blocks = serializeBlocks({ blocks: revision.blocks });
      const validation = validateBlocksForPage(page, blocks);
      if (!validation.ok) {
        return res.status(400).json({ error: validation.error });
      }

      const email = admin.email || 'admin';
      const existing = await Content.findOne({ page }).lean();
      const previousPublished = serializeBlocks(existing);

      if (Object.keys(previousPublished).length) {
        await saveRevisionSnapshot({
          pageKey: page,
          logicalPage: page,
          locale: 'en',
          blocks: previousPublished,
          savedBy: email,
        });
      }

      await Content.updateOne(
        { page },
        {
          $set: {
            blocks: encodeBlocks(validation.blocks),
            updatedBy: email,
            draftBlocks: {},
            draftUpdatedBy: '',
            draftUpdatedAt: null,
          },
          $setOnInsert: { page },
        },
        { upsert: true }
      );

      const doc = await Content.findOne({ page }).lean();

      await logContentAudit({
        pageKey: page,
        logicalPage: page,
        locale: 'en',
        action: 'restore',
        actor: email,
        keyCount: Object.keys(validation.blocks).length,
        revisionId,
        note: `Restored snapshot from ${new Date(revision.savedAt).toISOString()}`,
      });

      return res.status(200).json({
        ok: true,
        page,
        blocks: serializeBlocks(doc),
        ...contentMeta(doc),
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('admin/content-revisions failed:', err);
    return res.status(500).json({ error: 'Request failed.' });
  }
}
