import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import EmailJob from '../models/EmailJob.js';

// Queue bodies contain recovery links, so encrypt them at rest with a domain-separated key.
const key = createHash('sha256').update(`email-outbox:${env.JWT_REFRESH_SECRET}`).digest();
export function decodeEmail(payload) {
  const [iv, tag, ciphertext] = payload.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString());
}
export async function queueEmail(to, subject, text, expiresAt = new Date(Date.now() + 86400000)) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ to, subject, text })), cipher.final()]);
  const payload = [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
  await EmailJob.create({ payload, expiresAt });
}
let transporter;
export const emailDelivery = {
  async send(message, id) {
    if (env.MAIL_MODE === 'file') {
      const directory = fileURLToPath(new URL('../../mail-outbox/', import.meta.url));
      await mkdir(directory, { recursive: true });
      await writeFile(`${directory}/${randomUUID()}.json`, JSON.stringify(message, null, 2), { mode: 0o600, flag: 'wx' });
      return;
    }
    if (env.MAIL_MODE === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(20000),
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `account-email/${id}` },
        body: JSON.stringify({ from: env.MAIL_FROM, ...message }),
      });
      if (!response.ok) throw new Error('Email provider rejected the request');
      return;
    }
    transporter ??= nodemailer.createTransport({
      host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465,
      requireTLS: true, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
      ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
      disableFileAccess: true, disableUrlAccess: true,
    });
    await transporter.sendMail({ from: env.MAIL_FROM, ...message });
  },
};

export async function deliverNextEmail() {
  const now = new Date();
  const job = await EmailJob.findOneAndUpdate({ availableAt: { $lte: now }, leaseUntil: { $lte: now },
    expiresAt: { $gt: now }, attempts: { $lt: 5 } },
  { $set: { leaseUntil: new Date(Date.now() + 120000) }, $inc: { attempts: 1 } },
  { returnDocument: 'after', sort: { createdAt: 1 } }).select('+payload');
  if (!job) return false;
  try {
    await emailDelivery.send(decodeEmail(job.payload), job.id);
    await job.deleteOne();
  } catch {
    // Never log message bodies, recipient addresses, SMTP passwords, or recovery tokens.
    console.error('Email delivery failed; inspect mail provider settings. Queued retry will follow (up to 5 attempts).');
    await EmailJob.updateOne({ _id: job._id }, { $set: {
      availableAt: new Date(Date.now() + 30000 * 2 ** job.attempts), leaseUntil: new Date(0),
    } });
  }
  return true;
}
export function startEmailWorker() {
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try { await deliverNextEmail(); } catch { console.error('Email queue unavailable; retrying later.'); }
    finally { busy = false; }
  }, 1000);
  timer.unref();
  return () => clearInterval(timer);
}
