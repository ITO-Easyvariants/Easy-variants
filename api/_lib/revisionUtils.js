import ContentRevision from './ContentRevision.js';
import { encodeBlocks, decodeBlocks } from './blockKeyUtils.js';

export const MAX_REVISIONS = 15;

export async function saveRevisionSnapshot({ pageKey, logicalPage, locale, blocks, savedBy }) {
  if (!blocks || typeof blocks !== 'object' || !Object.keys(blocks).length) return null;

  const revision = await ContentRevision.create({
    pageKey,
    logicalPage,
    locale,
    blocks: encodeBlocks(blocks),
    savedBy,
    savedAt: new Date(),
  });

  await pruneRevisions(pageKey);
  return revision;
}

export async function pruneRevisions(pageKey) {
  const excess = await ContentRevision.find({ pageKey })
    .sort({ savedAt: -1 })
    .skip(MAX_REVISIONS)
    .select('_id')
    .lean();

  if (!excess.length) return;
  const ids = excess.map((r) => r._id);
  await ContentRevision.deleteMany({ _id: { $in: ids } });
}

export function formatRevision(row) {
  return {
    id: String(row._id),
    pageKey: row.pageKey,
    logicalPage: row.logicalPage,
    locale: row.locale,
    savedBy: row.savedBy,
    savedAt: row.savedAt,
    keyCount: Object.keys(decodeBlocks(row.blocks || {})).length,
  };
}
