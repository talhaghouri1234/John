import { test, expect, jest } from '@jest/globals';
import { env, loadEnv } from '../src/config/env.js';
import { emailDelivery } from '../src/utils/email.js';

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
