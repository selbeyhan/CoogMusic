import React from 'react';
import { Link } from 'react-router-dom';
import ProfileButton from './ProfileButton';
import './Header.css';

// import { useClerk } from '@clerk/clerk-react'; // Clerk authentication (Commented out)

function Header({ user }) {
  console.log("User state in Header:", JSON.stringify(user, null, 2)); // Debugging log to check full user object

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">CoogMusic</Link>
      </div>
      <div className="profile-area">
        {user ? (
          <ProfileButton
            profilePicture={user.profilePictureUrl || '/defaultProfile.png'}
            userId={user.user_id}
          />
        ) : (
          <button 
            className="login-button" 
            onClick={() => console.log("Login button clicked (Clerk not set up yet)")}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
