/**
 * CMS keys use dots (e.g. "hero.title.line1") but MongoDB field names
 * and Mongoose Maps forbid "." in keys. Encode on write, decode on read.
 */
const DOT_SUB = '\uE000';

export function encodeBlockKey(key) {
  return String(key).replace(/\./g, DOT_SUB);
}

export function decodeBlockKey(encoded) {
  return String(encoded).replace(/\uE000/g, '.');
}

export function encodeBlocks(blocks) {
  if (!blocks || typeof blocks !== 'object') return {};
  const out = {};
  for (const [key, block] of Object.entries(blocks)) {
    out[encodeBlockKey(key)] = block;
  }
  return out;
}

export function decodeBlocks(raw) {
  if (!raw) return {};
  const out = {};

  const entries =
    raw instanceof Map ? [...raw.entries()] : Object.entries(typeof raw === 'object' ? raw : {});

  for (const [key, block] of entries) {
    if (String(key).startsWith('$')) continue;
    out[decodeBlockKey(key)] = block;
  }
  return out;
}
