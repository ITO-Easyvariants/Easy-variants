import { connectToDatabase } from './_lib/mongodb.js';
import Lead from './_lib/Lead.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { firstName, lastName, email, company, message } = body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ error: 'firstName, lastName, email, and message are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    await connectToDatabase();

    const ipAddress =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '';

    const lead = await Lead.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(),
      company: String(company || '').trim(),
      message: String(message).trim(),
      ipAddress,
      userAgent: String(req.headers['user-agent'] || ''),
    });

    return res.status(201).json({ ok: true, id: lead._id });
  } catch (err) {
    console.error('POST /api/contact failed:', err);
    return res.status(500).json({ error: 'Could not save your message. Please try again later.' });
  }
}
