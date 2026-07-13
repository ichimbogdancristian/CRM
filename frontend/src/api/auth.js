import client from './client';

export const login = (email, password) => {
  return client.post('/auth/login/', { email, password });
};

export const logout = () => {
  return client.post('/auth/logout/');
};

export const me = () => {
  return client.get('/auth/me/');
};

export const requestPasswordReset = (email) => {
  return client.post('/auth/request-password-reset/', { email });
};

export const resetPassword = (uid, token, password, passwordConfirm) => {
  return client.post('/auth/reset-password/', { uid, token, password, password_confirm: passwordConfirm });
};

export const acceptInvite = (uid, token, firstName, lastName, phoneNumber, address, additionalInfo, password, passwordConfirm) => {
  return client.post('/auth/accept-invite/', {
    uid,
    token,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
    address,
    additional_info: additionalInfo,
    password,
    password_confirm: passwordConfirm,
  });
};

export const changePassword = (oldPassword, newPassword, newPasswordConfirm) => {
  return client.post('/auth/change-password/', { old_password: oldPassword, new_password: newPassword, new_password_confirm: newPasswordConfirm });
};

export const confirmEmailChange = (token) => {
  return client.post('/auth/confirm-email-change/', { token });
};
