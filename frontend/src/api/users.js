import client from './client';

export const listUsers = () => {
  return client.get('/users/');
};

export const inviteUser = (email, role) => {
  const data = { email };
  if (role === 'superuser') {
    data.is_superuser = true;
  } else if (role === 'staff') {
    data.is_staff = true;
  }
  return client.post('/users/invite/', data);
};

export const updateMe = (data) => {
  return client.patch('/users/me/', data);
};

export const updateUser = (userId, data) => {
  return client.patch(`/users/${userId}/`, data);
};

export const getUser = (userId) => {
  return client.get(`/users/${userId}/`);
};

export const getDashboardStats = () => {
  return client.get('/dashboard/stats/');
};

export const getAuditLogs = () => {
  return client.get('/dashboard/audit-logs/');
};
