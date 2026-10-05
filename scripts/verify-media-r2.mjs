import 'dotenv/config';
import { Readable } from 'stream';
import { handleMediaUpload, validateUpload, prepareMediaUpload } from '../api/_lib/mediaUpload.js';
import { readFile, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  } else {
    console.log('OK:', msg);
  }
}

const cases = [
  ['image', 'image/png', 1000, 'a.png', true],
  ['image', 'image/png', 6 * 1024 * 1024, 'a.png', false],
  ['icon', 'image/svg+xml', 1000, 'i.svg', true],
  ['video', 'video/mp4', 10 * 1024 * 1024, 'v.mp4', true],
  ['video', 'video/mp4', 51 * 1024 * 1024, 'v.mp4', false],
];

for (const [kind, mime, size, name, expectOk] of cases) {
  const r = validateUpload(kind, mime, size, name);
  assert(r.ok === expectOk, `validate ${kind} ${name} -> ${expectOk ? 'accept' : 'reject'}`);
}

const prep = await prepareMediaUpload({
  body: {
    action: 'prepare',
    kind: 'image',
    filename: 'test.png',
    mimeType: 'image/png',
    size: 1234,
  },
  headers: { 'content-type': 'application/json' },
});
assert(prep.ok && prep.mode === 'proxy', 'prepare returns proxy without R2');

const boundary = '----evtest';
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 1, 2, 3, 4, 5]);
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\nimage\r\n`),
  Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="smoke.png"\r\nContent-Type: image/png\r\n\r\n`
  ),
  png,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

const req = Readable.from(body);
req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}` };

const result = await handleMediaUpload(req);
assert(result.ok === true, 'local multipart upload ok');
assert(result.storage === 'local', 'storage is local');
assert(result.size === png.length, `size matches (${result.size} === ${png.length})`);
assert(String(result.src).startsWith('/uploads/cms/'), 'src is local cms path');

const diskPath = join(__dirname, '..', 'public', result.src.replace(/^\//, ''));
const onDisk = await readFile(diskPath);
assert(onDisk.length === png.length, 'on-disk byte length matches upload');
await unlink(diskPath);

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nALL MEDIA CHECKS PASSED');
