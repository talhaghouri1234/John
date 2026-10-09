import request from './request.js';
import User from '../src/models/User.js';
import app from '../src/app.js';

export async function session(role = 'admin') {
  const user = await User.create({ name: `${role} account`, email: `${role}@example.com`, password: 'Password123!', role });
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email: user.email, password: 'Password123!' });
  if (response.status !== 200) throw new Error('Test login failed');
  return { user, agent };
}
