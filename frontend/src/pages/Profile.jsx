import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as userAPI from '../api/users';
import './Profile.css';

export const Profile = () => {
  const { user, refreshUser, isStaff, isSuperuser } = useAuth();
  const [fullName, setFullName] = useState(`${user?.first_name || ''} ${user?.last_name || ''}`.trim());
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [address, setAddress] = useState(user?.address || '');
  const [additionalInfo, setAdditionalInfo] = useState(user?.additional_info || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editData, setEditData] = useState({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteIsStaff, setInviteIsStaff] = useState(false);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (isStaff || isSuperuser) {
      loadUsers();
      loadDashboard();
    }
  }, [isStaff, isSuperuser]);

  const loadUsers = async () => {
    try {
      const response = await userAPI.listUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadDashboard = async () => {
    try {
      const statsRes = await userAPI.getDashboardStats();
      setStats(statsRes.data);
      const logsRes = await userAPI.getAuditLogs();
      setAuditLogs(logsRes.data.slice(0, 10));
    } catch (err) {
      console.error('Failed to load dashboard', err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const [firstName, lastName] = fullName.split(' ').length > 1
      ? [fullName.split(' ')[0], fullName.split(' ').slice(1).join(' ')]
      : [fullName, ''];

    try {
      await userAPI.updateMe({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        address: address,
        additional_info: additionalInfo,
        email: email,
      });
      setMessage('Profile updated successfully!');
      await refreshUser();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
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

  const handleEditUser = async (userId, userData) => {
    try {
      await userAPI.updateUser(userId, userData);
      setMessage('User updated successfully!');
      setEditingUserId(null);
      setEditData({});
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update user');
    }
  };

  return (
    <div className="profile-container">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          My Profile
        </button>
        {(isStaff || isSuperuser) && (
          <>
            <button
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
          </>
        )}
      </div>

      {message && <div className="message">{message}</div>}

      {activeTab === 'profile' && (
        <div className="profile-card">
          <h1>My Profile</h1>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name (First and Last)</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State 12345"
                disabled={loading}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="additionalInfo">Additional Information</label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Any additional information about yourself"
                disabled={loading}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <small>Changing your email requires confirmation</small>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'users' && (isStaff || isSuperuser) && (
        <div className="profile-card">
          <h2>Invite New User</h2>
          <form onSubmit={handleInviteUser} className="invite-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inviteEmail">Email</label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="inviteFirstName">First Name</label>
                <input
                  id="inviteFirstName"
                  type="text"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="inviteLastName">Last Name</label>
                <input
                  id="inviteLastName"
                  type="text"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
            </div>
            {isSuperuser && (
              <div className="form-group">
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
            <button type="submit">Send Invitation</button>
          </form>

          <h2>Users Management</h2>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.phone_number || '-'}</td>
                    <td>{u.is_superuser ? 'Superuser' : u.is_staff ? 'Staff' : 'Client'}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingUserId(u.id);
                          setEditData({
                            first_name: u.first_name,
                            last_name: u.last_name,
                            phone_number: u.phone_number,
                            address: u.address,
                            additional_info: u.additional_info,
                          });
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingUserId && (
            <div className="modal-overlay" onClick={() => setEditingUserId(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Edit User</h3>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editData.first_name || ''}
                    onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editData.last_name || ''}
                    onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editData.phone_number || ''}
                    onChange={(e) => setEditData({...editData, phone_number: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={editData.address || ''}
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label>Additional Info</label>
                  <textarea
                    value={editData.additional_info || ''}
                    onChange={(e) => setEditData({...editData, additional_info: e.target.value})}
                    rows="2"
                  />
                </div>
                <div className="modal-buttons">
                  <button onClick={() => handleEditUser(editingUserId, editData)}>Save</button>
                  <button onClick={() => setEditingUserId(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (isSuperuser) && (
        <div className="profile-card">
          <h2>Admin Dashboard</h2>
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total_users}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.active_users}</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.staff_users}</div>
                <div className="stat-label">Staff Members</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.superuser_count}</div>
                <div className="stat-label">Superusers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.recent_logins}</div>
                <div className="stat-label">Logins (30 days)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.recent_invites}</div>
                <div className="stat-label">Invites (30 days)</div>
              </div>
            </div>
          )}

          <h3>Recent Activity</h3>
          <div className="audit-logs">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{log.actor_email}</td>
                    <td>{log.action}</td>
                    <td>{log.description}</td>
                    <td>{new Date(log.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
