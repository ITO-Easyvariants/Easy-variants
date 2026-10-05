import { connectToDatabase } from '../_lib/mongodb.js';
import Content from '../_lib/Content.js';
import { requireAdmin } from '../_lib/auth.js';
import {
  serializeBlocks,
  serializeDraftBlocks,
  validateBlocksForPage,
  contentMeta,
} from '../_lib/contentUtils.js';
import { saveRevisionSnapshot } from '../_lib/revisionUtils.js';
import { logContentAudit } from '../_lib/auditUtils.js';
import { encodeBlocks, decodeBlocks } from '../_lib/blockKeyUtils.js';

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
      const source = String(req.query?.source || 'published').toLowerCase();

      const doc = await Content.findOne({ page }).lean();
      const published = serializeBlocks(doc);
      const draft = serializeDraftBlocks(doc);
      const meta = contentMeta(doc);

      if (source === 'draft') {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({
          ok: true,
          page,
          source: 'draft',
          blocks: Object.keys(draft).length ? draft : published,
          isDraftPreview: Object.keys(draft).length > 0,
          ...meta,
        });
      }

      return res.status(200).json({
        ok: true,
        page,
        source: 'published',
        blocks: published,
        draftBlocks: draft,
        ...meta,
      });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const parsed = normalizePage(body.page);
      if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
      }

      const { page } = parsed;
      const blocks = decodeBlocks(body.blocks);
      const mode = String(body.mode || 'publish').toLowerCase();

      if (!['publish', 'draft'].includes(mode)) {
        return res.status(400).json({ error: 'mode must be "publish" or "draft".' });
      }

      const validation = validateBlocksForPage(page, blocks);
      if (!validation.ok) {
        return res.status(400).json({ error: validation.error });
      }

      const email = admin.email || 'admin';
      const now = new Date();

      const existing = await Content.findOne({ page }).lean();
      const previousPublished = serializeBlocks(existing);

      if (mode === 'draft') {
        await Content.updateOne(
          { page },
          {
            $set: {
              draftBlocks: encodeBlocks(validation.blocks),
              draftUpdatedBy: email,
              draftUpdatedAt: now,
            },
            $setOnInsert: { page, blocks: {} },
          },
          { upsert: true }
        );
      } else {
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
      }

      const doc = await Content.findOne({ page }).lean();

      const keyCount = Object.keys(validation.blocks).length;
      await logContentAudit({
        pageKey: page,
        logicalPage: page,
        locale: 'en',
        action: mode === 'draft' ? 'draft_save' : 'publish',
        actor: email,
        keyCount,
      });

      const published = serializeBlocks(doc);
      const draft = serializeDraftBlocks(doc);
      const meta = contentMeta(doc);

      return res.status(200).json({
        ok: true,
        page,
        mode,
        blocks: published,
        draftBlocks: draft,
        ...meta,
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('admin/content failed:', err);
    return res.status(500).json({ error: 'Request failed.' });
  }
}
