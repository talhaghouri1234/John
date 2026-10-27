import User from '../models/User.js';
import Session from '../models/Session.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/generateToken.js';

export const protect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.accessToken;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyToken(token, 'access');
  } catch {
    throw new ApiError(401, 'Authentication required');
  }

  const userId = payload.sub || payload.id;
  if (!userId) throw new ApiError(401, 'Authentication required');

  if (payload.sid && /^[a-f\d]{24}$/i.test(payload.sid)) {
    const user = await User.findById(userId).select('+authVersion');
    const session = await Session.findOne({ _id: payload.sid, user: userId, expiresAt: { $gt: new Date() } });
    if (!user || !user.isActive || !session || payload.version !== user.authVersion || session.authVersion !== user.authVersion) {
      throw new ApiError(401, 'Authentication required');
    }
    req.user = user;
    req.session = session;
  } else {
    throw new ApiError(401, 'Authentication required');
  }
  next();
});

export const optionalProtect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.accessToken;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();

  try {
    const payload = verifyToken(token, 'access');
    const userId = payload.sub || payload.id;
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    // Proceed unauthenticated
  }
  next();
});
