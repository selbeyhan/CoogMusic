import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import ProfileButton from './ProfileButton';
import HamburgerIcon from './HamburgerIcon';
import Sidebar from './Sidebar';
import './Header.css';


function Header() {
  const { isSignedIn, user } = useUser(); // Clerk authentication hook
  console.log("User state in Header:", JSON.stringify(user, null, 2)); // Debugging log to check full user object

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mysqlUserProfile, setMysqlUserProfile] = useState(null);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // ✅ Function to send user data to backend after sign-in
  useEffect(() => {
    if (isSignedIn && user) {
      console.log("✅ User is signed in. Sending data to backend...");

      const sendUserDataToBackend = async () => {
        const userData = {
          clerk_user_id: user.id,
          name: user.fullName || "No Name Provided",
          email: user.primaryEmailAddress?.emailAddress || "",
          password: "handled by Clerk auth",
        };

        console.log("📤 Sending user data to backend:", userData);

        try {
          const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          const data = await response.json();
          console.log("✅ Server response:", data);
        } catch (error) {
          console.error("❌ Error sending user data to backend:", error);
        }
      };

      const fetchMySQLUser = async () => {
        try {
          const response = await fetch(`/user/${user.id}`);
          const data = await response.json();
          console.log("📥 MySQL user data:", data.user);
          setMysqlUserProfile(data.user);
        } catch (error) {
          console.error("❌ Error fetching MySQL user:", error);
        }
      };

      sendUserDataToBackend();
      fetchMySQLUser();
    } else {
      console.log("❌ No signed-in user detected.");
    }
  }, [isSignedIn, user]);

  return (
    <>
      <header className="header">
        <div className="hamburger-left">
          <HamburgerIcon onClick={toggleSidebar} />
        </div>

        <div className="profile-area">
          {isSignedIn ? (
            <div className="user-info">
              <ProfileButton
                profilePicture={mysqlUserProfile?.profile_picture_url || 'coogmusiclogonobg.png'}
                userId={user.id}
              />
              {/* ✅ Admin Portal Button: Only visible if user is an admin */}
              {mysqlUserProfile && (
                mysqlUserProfile.admin_role ? (
                  <Link to="/adminportal">
                    <button className="admin-portal-btn">Admin Portal</button>
                  </Link>
                ) : null
              )}
              <SignOutButton className="logout-button" />
            </div>
          ) : (
              <Link to="/login" className="login-button">Sign In</Link>
            )}
        </div>
      </header>

      {/* Collapsible Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}

export default Header;
