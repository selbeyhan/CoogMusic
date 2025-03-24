import React, { useState, useEffect } from 'react';
import './AdminPortal.css'; // Include your styling file if needed

function AdminPortal() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await fetch('/admin-users');
        const data = await response.json();
        setUsers(data.users || data);
        console.log("📥 Fetched admin users:", data);
      } catch (error) {
        console.error("❌ Error fetching admin users:", error);
      }
    };

    fetchAdminUsers();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // ✅ Updated delete handler to support both clerk_user_id and user_id
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
        // Remove user from list regardless of which ID was used
        setUsers(prev => prev.filter(u =>
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

  const filteredUsers = users.filter(user =>
    Object.values(user).some(value =>
      value &&
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="admin-portal">
      <h1>Admin Portal: User Management</h1>
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
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
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
                <td>{user.verification_status}</td>
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
