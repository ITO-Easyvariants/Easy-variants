import Busboy from 'busboy';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mkdir, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_DIR = join(__dirname, '../../public/uploads/cms');

export const MEDIA_LIMITS = {
  image: 5 * 1024 * 1024,
  poster: 5 * 1024 * 1024,
  icon: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const SVG_MIMES = new Set(['image/svg+xml', 'image/svg']);

const PRESIGN_EXPIRES_SECONDS = 15 * 60;
const OBJECT_KEY_PREFIX = 'cms/';

function extForMime(mime) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/svg': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
  };
  return map[mime] || extname(mime) || '';
}

function sanitizeBaseName(filename) {
  const base = String(filename || 'upload')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'upload';
}

function maxBytesForKind(kind) {
  if (kind === 'video') return MEDIA_LIMITS.video;
  if (kind === 'poster') return MEDIA_LIMITS.poster;
  if (kind === 'icon') return MEDIA_LIMITS.icon;
  return MEDIA_LIMITS.image;
}

function isSvgUpload(mimeType, filename) {
  if (SVG_MIMES.has(mimeType)) return true;
  return /\.svg$/i.test(String(filename || ''));
}

function mimeFromFilename(filename) {
  const lower = String(filename || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return '';
}

function normalizeMime(mimeType, filename) {
  let mime = String(mimeType || '').toLowerCase();
  if (!mime || mime === 'application/octet-stream') {
    mime = mimeFromFilename(filename) || mime || 'application/octet-stream';
  }
  return isSvgUpload(mime, filename) ? 'image/svg+xml' : mime;
}

export function validateUpload(kind, mimeType, size, filename) {
  const max = maxBytesForKind(kind);
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: 'File size is missing or invalid.' };
  }
  if (size > max) {
    const mb = Math.round(max / (1024 * 1024));
    return { ok: false, error: `File exceeds ${mb} MB limit for ${kind}.` };
  }

  if (kind === 'video') {
    if (!VIDEO_MIMES.has(mimeType)) {
      return { ok: false, error: 'Video must be MP4, WebM, or MOV.' };
    }
    return { ok: true };
  }

  if (kind === 'icon') {
    if (isSvgUpload(mimeType, filename) || IMAGE_MIMES.has(mimeType)) {
      return { ok: true };
    }
    return { ok: false, error: 'Icon must be SVG, PNG, JPEG, WebP, or GIF.' };
  }

  if (!IMAGE_MIMES.has(mimeType)) {
    return { ok: false, error: 'Image must be JPEG, PNG, WebP, or GIF.' };
  }
  return { ok: true };
}

function buildObjectKey(filename, mimeType) {
  const suffix = randomBytes(6).toString('hex');
  return `${OBJECT_KEY_PREFIX}${sanitizeBaseName(filename)}-${suffix}${extForMime(mimeType)}`;
}

function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_BASE_URL
  );
}

function getR2PublicBaseUrl() {
  return String(process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
}

function publicUrlForKey(objectKey) {
  return `${getR2PublicBaseUrl()}/${objectKey}`;
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    // Newer AWS SDK versions add checksum headers that Cloudflare R2 rejects.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

function storageUnavailableError(kind) {
  const err = new Error(
    kind === 'video'
      ? 'Video cannot be saved on this host. Configure Cloudflare R2 (R2_* env vars) and redeploy.'
      : 'This file cannot be stored without Cloudflare R2. Configure R2_* env vars, or use a smaller file in local development.'
  );
  err.statusCode = 503;
  return err;
}

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Parse a single-file multipart request (field: kind, file: file).
 */
export function parseMultipartFile(req) {
  return new Promise((resolve, reject) => {
    const max = MEDIA_LIMITS.video;
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: max, files: 1, fields: 4 },
    });

    let kind = 'image';
    let buffer = null;
    let filename = 'upload';
    let mimeType = 'application/octet-stream';
    let size = 0;
    let limitHit = false;

    busboy.on('field', (name, value) => {
      if (name === 'kind') kind = String(value || 'image').toLowerCase();
    });

    busboy.on('file', (_name, file, info) => {
      filename = info.filename || 'upload';
      mimeType = info.mimeType || 'application/octet-stream';
      const chunks = [];

      file.on('data', (chunk) => {
        size += chunk.length;
        chunks.push(chunk);
      });

      file.on('limit', () => {
        limitHit = true;
        file.resume();
      });

      file.on('end', () => {
        if (!limitHit) buffer = Buffer.concat(chunks);
      });
    });

    busboy.on('error', reject);

    busboy.on('finish', () => {
      if (limitHit) {
        reject(new Error(`File exceeds maximum upload size.`));
        return;
      }
      if (!buffer || !buffer.length) {
        reject(new Error('No file uploaded.'));
        return;
      }
      resolve({ kind, buffer, filename, mimeType, size: buffer.length });
    });

    req.pipe(busboy);
  });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw httpError('Invalid JSON body.');
  }
}

async function storeLocal(buffer, filename, mimeType) {
  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const suffix = randomBytes(6).toString('hex');
  const safe = `${sanitizeBaseName(filename)}-${suffix}${extForMime(mimeType)}`;
  const fullPath = join(LOCAL_UPLOAD_DIR, safe);
  await writeFile(fullPath, buffer);
  return {
    src: `/uploads/cms/${safe}`,
    pathname: safe,
    size: buffer.length,
    mime: mimeType,
    storage: 'local',
  };
}

function isVercelRuntime() {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL);
}

/**
 * Prepare a direct-to-R2 upload. When R2 is not configured, returns mode: 'proxy'
 * so the client posts multipart to this same endpoint instead.
 */
export async function prepareMediaUpload(req) {
  const body = await readJsonBody(req);
  const kind = String(body.kind || 'image').toLowerCase();
  const filename = String(body.filename || 'upload');
  const size = Number(body.size);
  const mimeType = normalizeMime(String(body.mimeType || 'application/octet-stream'), filename);

  const validation = validateUpload(kind, mimeType, size, filename);
  if (!validation.ok) throw httpError(validation.error);

  if (!isR2Configured()) {
    if (isVercelRuntime()) throw storageUnavailableError(kind);
    return {
      ok: true,
      mode: 'proxy',
      kind,
      mime: mimeType,
      size,
      maxBytes: maxBytesForKind(kind),
    };
  }

  const objectKey = buildObjectKey(filename, mimeType);
  const client = getR2Client();
  // Do not sign ContentLength — browsers set it automatically on PUT and cannot
  // always override it. Size is verified in finalize via HeadObject.
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });

  return {
    ok: true,
    mode: 'r2',
    kind,
    objectKey,
    uploadUrl,
    mime: mimeType,
    size,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    publicSrc: publicUrlForKey(objectKey),
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  };
}

/**
 * Verify the R2 object exists and ContentLength matches the declared size.
 */
export async function finalizeMediaUpload(req) {
  const body = await readJsonBody(req);
  const kind = String(body.kind || 'image').toLowerCase();
  const filename = String(body.filename || 'upload');
  const size = Number(body.size);
  const mimeType = normalizeMime(String(body.mimeType || 'application/octet-stream'), filename);
  const objectKey = String(body.objectKey || '').trim();

  if (!isR2Configured()) {
    throw httpError('Cloudflare R2 is not configured.', 503);
  }

  if (!objectKey.startsWith(OBJECT_KEY_PREFIX) || objectKey.includes('..')) {
    throw httpError('Invalid object key.');
  }

  const validation = validateUpload(kind, mimeType, size, filename);
  if (!validation.ok) throw httpError(validation.error);

  const client = getR2Client();
  let head;
  try {
    head = await client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: objectKey,
      })
    );
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 404 || err?.name === 'NotFound' || err?.Code === 'NotFound') {
      throw httpError('Upload not found in Cloudflare R2. Please try again.', 404);
    }
    console.error('R2 HeadObject failed:', err);
    throw httpError('Could not verify upload in Cloudflare R2.', 502);
  }

  const storedSize = Number(head.ContentLength);
  if (!Number.isFinite(storedSize) || storedSize !== size) {
    throw httpError(
      `Stored file size (${storedSize} bytes) does not match upload (${size} bytes).`,
      409
    );
  }

  const storedMime = head.ContentType || mimeType;
  return {
    ok: true,
    kind,
    src: publicUrlForKey(objectKey),
    pathname: objectKey,
    size: storedSize,
    mime: storedMime,
    storage: 'r2',
  };
}

/**
 * Multipart proxy upload used for local development (and as a fallback path).
 */
export async function handleMediaUpload(req) {
  const parsed = await parseMultipartFile(req);
  const mimeType = normalizeMime(parsed.mimeType, parsed.filename);
  const validation = validateUpload(parsed.kind, mimeType, parsed.size, parsed.filename);
  if (!validation.ok) throw httpError(validation.error);

  if (isR2Configured()) {
    const objectKey = buildObjectKey(parsed.filename, mimeType);
    const client = getR2Client();
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: objectKey,
          Body: parsed.buffer,
          ContentType: mimeType,
          ContentLength: parsed.buffer.length,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
    } catch (err) {
      console.error('R2 PutObject (proxy) failed:', err);
      throw httpError('Failed to store file in Cloudflare R2.', 502);
    }
    return {
      ok: true,
      kind: parsed.kind,
      src: publicUrlForKey(objectKey),
      pathname: objectKey,
      size: parsed.buffer.length,
      mime: mimeType,
      storage: 'r2',
    };
  }

  if (isVercelRuntime()) {
    throw storageUnavailableError(parsed.kind);
  }

  try {
    const result = await storeLocal(parsed.buffer, parsed.filename, mimeType);
    return { ok: true, kind: parsed.kind, ...result };
  } catch (err) {
    if (err?.code === 'EROFS' || err?.code === 'EACCES') {
      throw storageUnavailableError(parsed.kind);
    }
    throw err;
  }
}

export function isMultipartRequest(req) {
  const ct = String(req.headers['content-type'] || '');
  return ct.includes('multipart/form-data');
}
