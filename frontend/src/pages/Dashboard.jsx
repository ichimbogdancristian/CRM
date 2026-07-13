import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user, isSuperuser, isStaff } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome, {user?.first_name || user?.email}</h1>
      <div style={{ marginTop: '2rem' }}>
        <p>Email: {user?.email}</p>
        <p>Role: {isSuperuser ? 'Superuser' : isStaff ? 'Staff' : 'Client'}</p>
      </div>
    </div>
  );
};
