import React, { useState } from 'react';
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
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

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
                profilePicture={user.profileImageUrl || 'coogmusiclogonobg.png'}
                userId={user.id}
              />
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