import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables.');
}

export function signAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extract a bearer token from a request's Authorization header.
 */
export function getTokenFromRequest(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  if (!header) return null;
  const [scheme, token] = String(header).split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Verify the request is an authenticated admin. Returns the decoded payload
 * or sends a 401 response and returns null.
 */
export function requireAdmin(req, res) {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'Missing authentication token.' });
    return null;
  }
  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return null;
  }
  return payload;
}
