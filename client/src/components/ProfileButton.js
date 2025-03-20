// src/components/ProfileButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileButton.css';

function ProfileButton({ profilePicture, userId }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="profile-button" onClick={handleClick} aria-label="Go to Profile">
      <img
        src={profilePicture || '/coogmusiclogonobg.png'} // Fallback if profilePicture is missing
        alt="User Profile"
        className="profile-picture"
        onError={(e) => e.target.src = '/coogmusiclogonobg.png'} // Replace broken images
      />
    </div>
  );
}

export default ProfileButton;
