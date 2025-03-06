// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import ProfileButton from './ProfileButton';
import './Header.css';

function Header({ user }) {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">CoogMusic</Link>
      </div>
      <div className="profile-area">
        <ProfileButton
          profilePicture={user.profilePictureUrl || '/defaultProfile.png'}
          userId={user.user_id}
        />
      </div>
    </header>
  );
}

export default Header;
