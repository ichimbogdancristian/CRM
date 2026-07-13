import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as userAPI from '../api/users';
import './UserManagement.css';

export const UserManagement = () => {
  const { isSuperuser, isStaff } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('client');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.listUsers();
      setUsers(response.data);
    } catch (err) {
      setMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await userAPI.inviteUser(inviteEmail, inviteRole);
      setMessage('User invited successfully!');
      setInviteEmail('');
      setInviteRole('client');
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.email?.[0] || 'Failed to invite user');
    }
  };

  if (!isSuperuser && !isStaff) {
    return <div style={{ padding: '2rem' }}>Access denied</div>;
  }

  return (
    <div className="user-management">
      <h1>User Management</h1>

      <div className="invite-section">
        <h2>Invite New User</h2>
        {message && <div className="success-message">{message}</div>}
        <form onSubmit={handleInvite} className="invite-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="client">Client</option>
              <option value="staff">Staff</option>
              {isSuperuser && <option value="superuser">Superuser</option>}
            </select>
          </div>
          <button type="submit" className="submit-button">
            Send Invitation
          </button>
        </form>
      </div>

      <div className="users-section">
        <h2>Users</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.first_name || user.last_name || '-'}</td>
                  <td>
                    {user.is_superuser ? 'Superuser' : user.is_staff ? 'Staff' : 'Client'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
