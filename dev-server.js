// Local API server that mirrors Vercel serverless functions.
// Vite proxies /api requests here in development.

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { readdirSync, statSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, relative } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Match Vite's local convention: .env.local overrides .env.
dotenv.config({ path: join(__dirname, '.env.local'), override: false });
dotenv.config({ path: join(__dirname, '.env'), override: false });
const PORT = process.env.API_PORT || 3001;
const API_DIR = join(__dirname, 'api');

const app = express();
app.use(cors());

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '_lib' || entry.startsWith('.')) continue;
      walk(full, files);
    } else if (entry.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

async function mountRoutes() {
  const files = walk(API_DIR);

  // Media upload must run before express.json() so multipart keeps a raw stream.
  // JSON prepare/finalize actions also hit this route (body parsed only for JSON).
  const mediaFile = files.find((f) => f.replace(/\\/g, '/').endsWith('admin/media.js'));
  if (mediaFile) {
    const mod = await import(pathToFileURL(mediaFile).href);
    const handler = mod.default;
    const jsonParser = express.json({ limit: '1mb' });
    app.post('/api/admin/media', (req, res) => {
      const ct = String(req.headers['content-type'] || '');
      if (ct.includes('multipart/form-data')) {
        Promise.resolve(handler(req, res)).catch((err) => {
          console.error('[dev-server] /api/admin/media threw:', err);
          if (!res.headersSent) res.status(500).json({ error: 'Internal server error.' });
        });
        return;
      }
      jsonParser(req, res, (err) => {
        if (err) {
          if (!res.headersSent) res.status(400).json({ error: 'Invalid JSON body.' });
          return;
        }
        Promise.resolve(handler(req, res)).catch((e) => {
          console.error('[dev-server] /api/admin/media threw:', e);
          if (!res.headersSent) res.status(500).json({ error: 'Internal server error.' });
        });
      });
    });
    console.log('[dev-server]  /api/admin/media (multipart + JSON prepare/finalize)');
  }

  app.use(express.json({ limit: '4mb' }));

  for (const file of files) {
    const rel = relative(API_DIR, file).replace(/\\/g, '/').replace(/\.js$/, '');
    const route = '/api/' + rel;
    if (route === '/api/admin/media') continue;

    const mod = await import(pathToFileURL(file).href);
    const handler = mod.default;
    if (typeof handler !== 'function') {
      console.warn(`[dev-server] ${file} has no default export, skipping.`);
      continue;
    }

    app.all(route, (req, res) => {
      Promise.resolve(handler(req, res)).catch((err) => {
        console.error(`[dev-server] ${route} threw:`, err);
        if (!res.headersSent) res.status(500).json({ error: 'Internal server error.' });
      });
    });
    console.log(`[dev-server]  ${route}`);
  }
}

mountRoutes()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n[dev-server] API ready at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('[dev-server] Failed to start:', err);
    process.exit(1);
  });
