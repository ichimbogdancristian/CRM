import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as userAPI from '../api/users';

export const UserManagement = () => {
  const { isSuperuser, isStaff } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteIsStaff, setInviteIsStaff] = useState(false);
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
      await userAPI.inviteUser(inviteEmail, inviteFirstName, inviteLastName, inviteIsStaff);
      setMessage('User invited successfully!');
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      setInviteIsStaff(false);
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
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>User Management</h1>

      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
        <h2>Invite New User</h2>
        {message && <div style={{ color: '#28a745', marginBottom: '1rem' }}>{message}</div>}
        <form onSubmit={handleInvite}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>First Name</label>
            <input
              type="text"
              value={inviteFirstName}
              onChange={(e) => setInviteFirstName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Last Name</label>
            <input
              type="text"
              value={inviteLastName}
              onChange={(e) => setInviteLastName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          {isSuperuser && (
            <div style={{ marginBottom: '1rem' }}>
              <label>
                <input
                  type="checkbox"
                  checked={inviteIsStaff}
                  onChange={(e) => setInviteIsStaff(e.target.checked)}
                />
                Make Staff
              </label>
            </div>
          )}
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>
            Send Invitation
          </button>
        </form>
      </div>

      <div>
        <h2>Users</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '0.5rem' }}>{user.email}</td>
                  <td style={{ padding: '0.5rem' }}>{user.first_name || user.last_name || '-'}</td>
                  <td style={{ padding: '0.5rem' }}>
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
