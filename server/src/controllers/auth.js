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

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !user.isActive || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  await startSession(user, res);
  res.json({ success: true, message: 'Signed in', user });
}
