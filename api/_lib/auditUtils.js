import ContentAudit from './ContentAudit.js';

export async function logContentAudit({
  pageKey,
  logicalPage,
  locale,
  action,
  actor,
  keyCount = 0,
  revisionId = '',
  note = '',
}) {
  try {
    await ContentAudit.create({
      pageKey,
      logicalPage,
      locale,
      action,
      actor,
      keyCount,
      revisionId,
      note,
    });
  } catch (err) {
    console.error('logContentAudit failed:', err);
  }
}

export function formatAuditEntry(row) {
  return {
    id: String(row._id),
    pageKey: row.pageKey,
    logicalPage: row.logicalPage,
    locale: row.locale,
    action: row.action,
    actor: row.actor,
    keyCount: row.keyCount,
    revisionId: row.revisionId || '',
    note: row.note || '',
    at: row.at,
  };
}
