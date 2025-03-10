// src/components/ProfileButton.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileButton.css';

function ProfileButton({ profilePicture, userId }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to the user's profile page (adjust the path as needed)
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="profile-button" onClick={handleClick}>
      <img src={profilePicture} alt="Profile" className="profile-picture" />
    </div>
  );
}

export default ProfileButton;
