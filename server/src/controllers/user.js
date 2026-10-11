import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import escapeRegex from '../utils/escapeRegex.js';
import Session from '../models/Session.js';
import { audit } from '../utils/audit.js';

export async function listUsers(req, res) {
  const { page, limit, search } = req.query;
  const filter = search ? { $or: [{ name: { $regex: escapeRegex(search), $options: 'i' } }, { email: { $regex: escapeRegex(search), $options: 'i' } }] } : {};
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, message: 'Users retrieved', users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function managedUser(req) {
  if (String(req.user._id) === req.params.id) throw new ApiError(400, 'You cannot change your own access');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function updateRole(req, res) {
  const user = await managedUser(req);
  user.role = req.body.role;
  user.refreshTokenHash = undefined;
  await user.save();
  await User.updateOne({ _id: user._id }, { $inc: { authVersion: 1 } });
  await Session.deleteMany({ user: user._id });
  await audit(req, 'user.role', user._id, { role: user.role });
  res.json({ success: true, message: 'Role updated', user });
}

export async function updateActive(req, res) {
  const user = await managedUser(req);
  user.isActive = req.body.isActive;
  user.refreshTokenHash = undefined;
  await user.save();
  await User.updateOne({ _id: user._id }, { $inc: { authVersion: 1 } });
  await Session.deleteMany({ user: user._id });
  await audit(req, 'user.active', user._id, { isActive: user.isActive });
  res.json({ success: true, message: 'Account status updated', user });
}

export async function deleteUser(req, res) {
  const user = await managedUser(req);
  await user.deleteOne();
  await Session.deleteMany({ user: user._id });
  await audit(req, 'user.delete', user._id);
  res.json({ success: true, message: 'User deleted' });
}
