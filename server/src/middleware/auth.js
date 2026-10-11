import User from '../models/User.js';
import Session from '../models/Session.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/generateToken.js';

export const protect = asyncHandler(async (req, _res, next) => {
  let payload;
  try { payload = verifyToken(req.cookies.accessToken, 'access'); }
  catch { throw new ApiError(401, 'Authentication required'); }
  if (!/^[a-f\d]{24}$/i.test(payload.sid || '')) throw new ApiError(401, 'Authentication required');
  const user = await User.findById(payload.sub).select('+authVersion');
  const session = await Session.findOne({ _id: payload.sid, user: payload.sub, expiresAt: { $gt: new Date() } });
  if (!user || !user.isActive || !session || payload.version !== user.authVersion || session.authVersion !== user.authVersion) {
    throw new ApiError(401, 'Authentication required');
  }
  req.user = user;
  req.session = session;
  next();
});
