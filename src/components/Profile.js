// src/components/Profile.js
import React from 'react';
import { useParams } from 'react-router-dom';

function Profile() {
  const { userId } = useParams();
  return (
    <div>
      <h1>Profile Page</h1>
      <p>User ID: {userId}</p>
      {/* Add more profile details here */}
    </div>
  );
}

export default Profile;
