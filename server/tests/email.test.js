import { test, expect, jest } from '@jest/globals';
import { env, loadEnv } from '../src/config/env.js';
import { emailDelivery, emailFailure, queueEmail, deliverNextEmail } from '../src/utils/email.js';
import EmailJob from '../src/models/EmailJob.js';

test('HTTPS delivery uses a stable idempotency key and retries provider errors through the queue', async () => {
  const previous = { mode: env.MAIL_MODE, key: env.RESEND_API_KEY };
  env.MAIL_MODE = 'resend'; env.RESEND_API_KEY = 'test-only-key';
  const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false });
  const message = { to: 'recipient@example.test', subject: 'Test', text: 'Hello' };
  try {
    await emailDelivery.send(message, 'job-1');
    expect(fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      headers: expect.objectContaining({ 'Idempotency-Key': 'account-email/job-1' }),
      body: JSON.stringify({ from: env.MAIL_FROM, ...message }),
    }));
    await expect(emailDelivery.send(message, 'job-1')).rejects.toThrow('Email provider rejected');
  } finally { env.MAIL_MODE = previous.mode; env.RESEND_API_KEY = previous.key; fetch.mockRestore(); }
});

test('production cannot silently use a development outbox or missing mail credentials', () => {
  const base = { ...process.env, NODE_ENV: 'production', CLIENT_URL: 'https://app.example.com' };
  expect(() => loadEnv({ ...base, MAIL_MODE: 'file' })).toThrow();
  expect(() => loadEnv({ ...base, MAIL_MODE: 'smtp', SMTP_HOST: '' })).toThrow();
  expect(() => loadEnv({ ...base, MAIL_MODE: 'resend', RESEND_API_KEY: '' })).toThrow();
  expect(loadEnv({ ...base, MAIL_MODE: 'resend', RESEND_API_KEY: 'test-only' }).MAIL_MODE).toBe('resend');
});

test('SMTP credentials alone retain local preview mode; explicit smtp enables real delivery', () => {
  const base = { ...process.env, NODE_ENV: 'development', MAIL_MODE: undefined, SMTP_HOST: 'smtp.example.test', SMTP_USER: 'test', SMTP_PASS: 'test' };
  expect(loadEnv(base).MAIL_MODE).toBe('file');
  expect(loadEnv({ ...base, MAIL_MODE: 'smtp' }).MAIL_MODE).toBe('smtp');
});

test('unreadable legacy queue jobs stop retrying and never reach the provider', async () => {
  const job = await EmailJob.create({ payload: 'unreadable', expiresAt: new Date(Date.now() + 60000) });
  const send = jest.spyOn(emailDelivery, 'send').mockResolvedValue(undefined);
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(await deliverNextEmail()).toBe(true);
    const result = await EmailJob.findById(job._id);
    expect(result.lastErrorCode).toBe('EMAIL_DECRYPTION_FAILED');
    expect(result.failedAt).toBeInstanceOf(Date);
    expect(await deliverNextEmail()).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain('Request a fresh link');
  } finally { send.mockRestore(); log.mockRestore(); }
});

test('workers skip jobs belonging to another encryption key', async () => {
  await EmailJob.create({ payload: 'unreadable', keyId: 'different-key', expiresAt: new Date(Date.now() + 60000) });
  expect(await deliverNextEmail()).toBe(false);
  expect((await EmailJob.findOne()).attempts).toBe(0);
});

test('valid encrypted jobs deliver and exhausted SMTP failures report that retries stopped', async () => {
  await queueEmail('test@example.test', 'Test', 'Private recovery text');
  const send = jest.spyOn(emailDelivery, 'send').mockResolvedValueOnce(undefined);
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await deliverNextEmail();
    expect(await EmailJob.countDocuments()).toBe(0);
    await queueEmail('test@example.test', 'Test', 'Private recovery text');
    await EmailJob.updateMany({}, { $set: { attempts: 4 } });
    send.mockRejectedValueOnce(Object.assign(new Error('Private SMTP password'), { code: 'EAUTH' }));
    await deliverNextEmail();
    expect((await EmailJob.findOne()).lastErrorCode).toBe('EAUTH');
    expect(log.mock.calls[0][0]).toContain('Retries stopped');
    expect(log.mock.calls[0][0]).not.toContain('Private SMTP password');
    expect(emailFailure(new Error('secret')).reason).not.toContain('secret');
  } finally { send.mockRestore(); log.mockRestore(); }
});
