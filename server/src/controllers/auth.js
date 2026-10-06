import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateTokens, hashToken, setCookies, clearCookies, verifyToken } from '../utils/generateToken.js';

async function startSession(user, res) {
  const tokens = generateTokens(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();
  setCookies(res, tokens);
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({ name, email, password, role: 'user' });
  await startSession(user, res);
  res.status(201).json({ success: true, message: 'Account created', user });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !user.isActive || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  await startSession(user, res);
  res.json({ success: true, message: 'Signed in', user });
}

export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  let payload;
  try { payload = verifyToken(token, 'refresh'); }
  catch { clearCookies(res); throw new ApiError(401, 'Session expired'); }
  const tokens = generateTokens({ _id: payload.sub });
  // Atomic compare-and-swap makes every refresh token single use.
  const user = await User.findOneAndUpdate(
    { _id: payload.sub, isActive: true, refreshTokenHash: hashToken(token) },
    { $set: { refreshTokenHash: hashToken(tokens.refreshToken) } },
    { new: true },
  );
  if (!user) { clearCookies(res); throw new ApiError(401, 'Session expired'); }
  setCookies(res, tokens);
  res.json({ success: true, message: 'Session refreshed', user });
}

export async function logout(req, res) {
  if (req.cookies.refreshToken) {
    await User.updateOne({ refreshTokenHash: hashToken(req.cookies.refreshToken) }, { $unset: { refreshTokenHash: 1 } });
  }
  clearCookies(res);
  res.json({ success: true, message: 'Signed out' });
}

export function getMe(req, res) {
  res.json({ success: true, message: 'Current user', user: req.user });
}
