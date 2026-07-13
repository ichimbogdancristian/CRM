import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export const Dashboard = () => {
  const { user, isSuperuser, isStaff } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.first_name || user?.email}</h1>
      </div>
      <div className="dashboard-content">
        <div className="info-card">
          <div className="info-field">
            <label>Email</label>
            <p>{user?.email}</p>
          </div>
          <div className="info-field">
            <label>Role</label>
            <p>{isSuperuser ? 'Superuser' : isStaff ? 'Staff' : 'Client'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
