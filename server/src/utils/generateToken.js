import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');
export const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: env.COOKIE_SAME_SITE, path: '/' };
const duration = (value) => Number(value.slice(0, -1)) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[value.slice(-1)];

export function generateTokens(user) {
  const common = { subject: String(user._id), issuer: 'mern-api', audience: 'mern-client', algorithm: 'HS256' };
  return {
    accessToken: jwt.sign({ type: 'access' }, env.JWT_ACCESS_SECRET, { ...common, expiresIn: env.JWT_ACCESS_EXPIRES }),
    refreshToken: jwt.sign({ type: 'refresh' }, env.JWT_REFRESH_SECRET, { ...common, jwtid: randomUUID(), expiresIn: env.JWT_REFRESH_EXPIRES }),
  };
}

export function verifyToken(token, type) {
  const payload = jwt.verify(token, type === 'access' ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET, {
    algorithms: ['HS256'], issuer: 'mern-api', audience: 'mern-client',
  });
  if (payload.type !== type) throw new Error('Incorrect token type');
  return payload;
}

export function setCookies(res, tokens) {
  res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: duration(env.JWT_ACCESS_EXPIRES) });
  res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: duration(env.JWT_REFRESH_EXPIRES) });
}

export function clearCookies(res) {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}
