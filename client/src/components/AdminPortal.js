import React, { useState, useEffect } from 'react';
import './AdminPortal.css';

function AdminPortal() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showingUnverified, setShowingUnverified] = useState(false);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await fetch('/admin-users');
        const data = await response.json();
        const userList = data.users || data;
        setUsers(userList);
        setFilteredUsers(userList);
        console.log("📥 Fetched admin users:", userList);
      } catch (error) {
        console.error("❌ Error fetching admin users:", error);
      }
    };

    fetchAdminUsers();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async (user) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    const idToDelete = user.clerk_user_id || user.user_id;
    const endpoint = user.clerk_user_id
      ? `/user/${encodeURIComponent(idToDelete)}`
      : `/delete-by-id/${encodeURIComponent(idToDelete)}`;

    try {
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        setUsers(prev => prev.filter(u =>
          u.clerk_user_id !== user.clerk_user_id && u.user_id !== user.user_id
        ));
        setFilteredUsers(prev => prev.filter(u =>
          u.clerk_user_id !== user.clerk_user_id && u.user_id !== user.user_id
        ));
        console.log("✅ User deleted successfully");
      } else {
        const data = await response.json();
        console.error("❌ Delete failed:", data.error || data.message);
      }
    } catch (err) {
      console.error("❌ Error deleting user:", err);
    }
  };

  // ✅ Handle verification status dropdown change
  const handleVerificationChange = async (userId, newStatus) => {
    try {
      const response = await fetch(`/update-verification/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: newStatus })
      });

      if (response.ok) {
        setUsers(prev =>
          prev.map(user =>
            user.user_id === userId
              ? { ...user, verification_status: newStatus }
              : user
          )
        );
        setFilteredUsers(prev =>
          prev.map(user =>
            user.user_id === userId
              ? { ...user, verification_status: newStatus }
              : user
          )
        );
        console.log(`✅ Updated verification for user_id ${userId} to ${newStatus}`);
      } else {
        console.error("❌ Failed to update verification");
      }
    } catch (err) {
      console.error("❌ Error updating verification:", err);
    }
  };

  const handleShowUnverified = () => {
    setFilteredUsers(users.filter(user => user.verification_status === 0));
    setShowingUnverified(true);
  };

  const handleShowAll = () => {
    setFilteredUsers(users);
    setShowingUnverified(false);
  };

  const searchFilteredUsers = filteredUsers.filter(user =>
    Object.values(user).some(value =>
      value &&
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="admin-portal">
      <h1>Admin Portal: User Management</h1>

      <div className="button-row" style={{ marginBottom: '10px' }}>
        {!showingUnverified ? (
          <button onClick={handleShowUnverified}>Show Unverified Users</button>
        ) : (
          <button onClick={handleShowAll}>Show All Users</button>
        )}
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
            <th>Account Type</th>
            <th>Registration Date</th>
            <th>Profile Picture</th>
            <th>Bio</th>
            <th>Monthly Listeners</th>
            <th>UH Affiliation</th>
            <th>Verification Status</th>
            <th>Admin Role</th>
            <th>User ID</th>
            <th>Clerk User ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {searchFilteredUsers.length > 0 ? (
            searchFilteredUsers.map((user, index) => (
              <tr key={index}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.account_type}</td>
                <td>{user.registration_date}</td>
                <td>
                  <img
                    src={user.profile_picture_url || 'default-profile.png'}
                    alt="Profile"
                    style={{ width: '50px', height: '50px' }}
                  />
                </td>
                <td>{user.bio}</td>
                <td>{user.monthly_listeners}</td>
                <td>{user.uh_affiliation}</td>
                <td>
                  <select
                    value={user.verification_status}
                    onChange={(e) =>
                      handleVerificationChange(user.user_id, parseInt(e.target.value))
                    }
                  >
                    <option value={1}>Verified</option>
                    <option value={0}>Unverified</option>
                  </select>
                </td>
                <td>{user.admin_role}</td>
                <td>{user.user_id}</td>
                <td>{user.clerk_user_id}</td>
                <td>
                  <button onClick={() => console.log("Edit user:", user.user_id)}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(user)}>
                    Delete
                  </button>
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
