import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { generateTokens, hashToken, setCookies } from '../utils/generateToken.js';

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
