import client from './client';

export const listUsers = () => {
  return client.get('/users/');
};

export const inviteUser = (email, firstName, lastName, isStaff) => {
  return client.post('/users/invite/', { email, first_name: firstName, last_name: lastName, is_staff: isStaff });
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
