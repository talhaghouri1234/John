import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/generateToken.js';

export const protect = asyncHandler(async (req, _res, next) => {
  let payload;
  try { payload = verifyToken(req.cookies.accessToken, 'access'); }
  catch { throw new ApiError(401, 'Authentication required'); }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Authentication required');
  req.user = user;
  next();
});
