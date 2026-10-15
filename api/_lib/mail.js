import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      (process.env.MAIL_FROM || process.env.SMTP_USER) &&
      (process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL)
  );
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === 'true' ||
    process.env.SMTP_SECURE === '1' ||
    port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail({ to, subject, text, html, replyTo }) {
  if (!isMailConfigured()) {
    throw new Error('Email is not configured. Set SMTP_* and CONTACT_TO_EMAIL env vars.');
  }

  const transport = createTransport();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  return transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
    replyTo: replyTo || undefined,
  });
}

export function buildContactNotificationEmail(lead) {
  const name = `${lead.firstName} ${lead.lastName}`.trim();
  const company = lead.company || '—';
  const subject = `New contact form: ${name}`;

  const text = [
    'New contact form submission',
    '',
    `Name: ${name}`,
    `Email: ${lead.email}`,
    `Company: ${company}`,
    '',
    'Message:',
    lead.message,
    '',
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h2 style="margin:0 0 12px;">New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(company)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:8px;">${escapeHtml(lead.message)}</p>
    </div>
  `;

  return { subject, text, html, replyTo: lead.email };
}

export function buildThankYouEmail(lead) {
  const name = lead.firstName || 'there';
  const brand = process.env.MAIL_BRAND_NAME || 'Easy Variants';
  const subject = `Thanks for contacting ${brand}`;

  const text = [
    `Hi ${name},`,
    '',
    `Thanks for reaching out to ${brand}. We received your message and will get back to you soon.`,
    '',
    'Here is a copy of what you sent:',
    '',
    lead.message,
    '',
    `— The ${brand} team`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for reaching out to <strong>${escapeHtml(brand)}</strong>. We received your message and will get back to you soon.</p>
      <p>Here is a copy of what you sent:</p>
      <p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:8px;">${escapeHtml(lead.message)}</p>
      <p>— The ${escapeHtml(brand)} team</p>
    </div>
  `;

  return { subject, text, html };
}

export async function sendContactEmails(lead) {
  if (!isMailConfigured()) {
    console.warn(
      '[mail] Skipping emails — set SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM, and CONTACT_TO_EMAIL.'
    );
    return { skipped: true };
  }

  const notifyTo = process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL;
  const notification = buildContactNotificationEmail(lead);
  const thankYou = buildThankYouEmail(lead);

  const [notifyResult, thankYouResult] = await Promise.allSettled([
    sendMail({
      to: notifyTo,
      subject: notification.subject,
      text: notification.text,
      html: notification.html,
      replyTo: notification.replyTo,
    }),
    sendMail({
      to: lead.email,
      subject: thankYou.subject,
      text: thankYou.text,
      html: thankYou.html,
    }),
  ]);

  if (notifyResult.status === 'rejected') {
    console.error('[mail] Admin notification failed:', notifyResult.reason);
  }
  if (thankYouResult.status === 'rejected') {
    console.error('[mail] Thank-you email failed:', thankYouResult.reason);
  }

  return {
    skipped: false,
    notified: notifyResult.status === 'fulfilled',
    thanked: thankYouResult.status === 'fulfilled',
  };
}
