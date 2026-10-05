import { connectToDatabase } from './_lib/mongodb.js';
import Content from './_lib/Content.js';
import { serializeBlocks } from './_lib/contentUtils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const page = String(req.query?.page || '')
    .trim()
    .toLowerCase();

  if (!page) {
    return res.status(400).json({ error: 'Query parameter "page" is required.' });
  }

  if (!/^[a-z0-9-]+$/.test(page)) {
    return res.status(400).json({ error: 'Invalid page identifier.' });
  }

  try {
    await connectToDatabase();
    const doc = await Content.findOne({ page }).lean();

    // This is small CMS JSON. Do not let browsers or Vercel's CDN serve stale
    // media URLs after an admin publishes new content.
    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({
      ok: true,
      page,
      blocks: serializeBlocks(doc),
      updatedAt: doc?.updatedAt || null,
    });
  } catch (err) {
    console.error('GET /api/content failed:', err);
    return res.status(500).json({ error: 'Failed to load content.' });
  }
}
