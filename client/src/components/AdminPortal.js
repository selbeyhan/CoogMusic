import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AdminPortal.css';

function AdminPortal() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showingUnverified, setShowingUnverified] = useState(false);

  useEffect(() => {
    async function fetchAdminUsers() {
      try {
        const res = await fetch('/admin-users');
        const data = await res.json();
        const list = data.users || data;
        setUsers(list);
        setFilteredUsers(list);
      } catch (err) {
        console.error('❌ Error fetching admin users:', err);
      }
    }
    fetchAdminUsers();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (user) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const id = user.clerk_user_id || user.user_id;
    const endpoint = user.clerk_user_id
      ? `/user/${encodeURIComponent(id)}`
      : `/delete-by-id/${encodeURIComponent(id)}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        setUsers(u => u.filter(
          u => u.clerk_user_id !== user.clerk_user_id && u.user_id !== user.user_id
        ));
        setFilteredUsers(u => u.filter(
          u => u.clerk_user_id !== user.clerk_user_id && u.user_id !== user.user_id
        ));
      } else {
        console.error('❌ Delete failed:', await res.json());
      }
    } catch (err) {
      console.error('❌ Error deleting user:', err);
    }
  };

  const handleVerificationChange = async (userId, newStatus) => {
    try {
      const res = await fetch(`/update-verification/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: newStatus }),
      });
      if (res.ok) {
        setUsers(u => u.map(u =>
          u.user_id === userId ? { ...u, verification_status: newStatus } : u
        ));
        setFilteredUsers(u => u.map(u =>
          u.user_id === userId ? { ...u, verification_status: newStatus } : u
        ));
      } else {
        console.error('❌ Failed to update verification');
      }
    } catch (err) {
      console.error('❌ Error updating verification:', err);
    }
  };

  const handleShowUnverified = () => {
    setFilteredUsers(users.filter(u => u.verification_status === 0));
    setShowingUnverified(true);
  };

  const handleShowAll = () => {
    setFilteredUsers(users);
    setShowingUnverified(false);
  };

  const searchFilteredUsers = filteredUsers.filter(user =>
    Object.values(user).some(val =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="admin-portal">
      <h1>Admin Portal: User Management</h1>

      <div className="button-row">
        <Link to="/admin/reports">
          <button className="primary">Show Data Reports</button>
        </Link>
        {!showingUnverified
          ? <button onClick={handleShowUnverified}>Show Unverified Users</button>
          : <button onClick={handleShowAll}>Show All Users</button>
        }
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Type</th>
            <th>Joined</th>
            <th>Avatar</th>
            <th>Bio</th>
            <th>Listens</th>
            <th>Affil</th>
            <th>Status</th>
            <th>Role</th>
            <th>ID</th>
            <th>ClerkID</th>
            <th>Act</th>
          </tr>
        </thead>
        <tbody>
          {searchFilteredUsers.length > 0 ? (
            searchFilteredUsers.map((u, idx) => (
              <tr key={idx}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.account_type}</td>
                <td>{u.registration_date}</td>
                <td>
                  <img
                    src={u.profile_picture_url || 'default-profile.png'}
                    alt="Avatar"
                    width="50"
                    height="50"
                  />
                </td>
                <td>{u.bio}</td>
                <td>{u.monthly_listeners}</td>
                <td>{u.uh_affiliation}</td>
                <td>
                  <select
                    value={u.verification_status}
                    onChange={e =>
                      handleVerificationChange(u.user_id, +e.target.value)
                    }
                  >
                    <option value={1}>Verified</option>
                    <option value={0}>Unverified</option>
                  </select>
                </td>
                <td>{u.admin_role}</td>
                <td>{u.user_id}</td>
                <td>{u.clerk_user_id}</td>
                <td>
                  <button onClick={() => handleDelete(u)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="13">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPortal;
