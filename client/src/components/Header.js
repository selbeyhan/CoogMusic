import React from 'react';
import { Link } from 'react-router-dom';
import { useUser, SignInButton, SignOutButton } from '@clerk/clerk-react';
import ProfileButton from './ProfileButton';
import './Header.css';

function Header() {
  const { isSignedIn, user } = useUser(); // Clerk authentication hook

  console.log("User state in Header:", JSON.stringify(user, null, 2)); // Debugging log to check full user object

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">CoogMusic</Link>
      </div>
      <div className="profile-area">
        {isSignedIn ? (
          <div className="user-info">
            <ProfileButton
              profilePicture={user.profileImageUrl || '/defaultProfile.png'}
              userId={user.id}
            />
            <SignOutButton className="logout-button" />
          </div>
        ) : (
          <SignInButton className="login-button" />
        )}
      </div>
    </header>
  );
}

export default Header;
