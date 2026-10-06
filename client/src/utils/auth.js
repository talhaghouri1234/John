export const dashboardPath = (user) => user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
