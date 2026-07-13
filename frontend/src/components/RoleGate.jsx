import { useAuth } from '../context/AuthContext';

export const RoleGate = ({ allow, children, fallback = null }) => {
  const { isSuperuser, isStaff, isClient } = useAuth();
  const roles = Array.isArray(allow) ? allow : [allow];

  const hasRole = roles.some(role => {
    if (role === 'superuser') return isSuperuser;
    if (role === 'staff') return isStaff;
    if (role === 'client') return isClient;
    if (role === 'staff_or_superuser') return isStaff || isSuperuser;
    return false;
  });

  return hasRole ? children : fallback;
};
