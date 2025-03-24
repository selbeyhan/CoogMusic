import React, { useState, useEffect } from 'react';
import './AdminPortal.css'; // Include your styling file if needed

function AdminPortal() {
  // State to hold all admin users fetched from the backend
  const [users, setUsers] = useState([]);
  // State to handle the search input value
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Fetch admin user data from the backend when the component mounts
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await fetch('/admin-users');
        const data = await response.json();
        // Assuming the returned data is an array of user objects
        setUsers(data.users || data);
        console.log("📥 Fetched admin users:", data);
      } catch (error) {
        console.error("❌ Error fetching admin users:", error);
      }
    };

    fetchAdminUsers();
  }, []);

  // ✅ Handle search input changes
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // ✅ Filter users based on the search term (client-side search)
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
        {/* Search input to filter users */}
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
                  {/* Future functionality for editing user data */}
                  <button onClick={() => console.log("Edit user:", user.user_id)}>
                    Edit
                  </button>
                  {/* Future functionality for deleting a user */}
                  <button onClick={() => console.log("Delete user:", user.user_id)}>
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
