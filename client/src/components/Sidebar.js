// src/components/Sidebar.js
import React from 'react';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Optional close button */}
      <button className="close-btn" onClick={onClose}>
        &times;
      </button>


      {/* currently not yet filled out all the way , placeholders atm */}
      <ul className="sidebar-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/about">About</a></li>

        {/* 🔹 Added Explore and Search links */}
        <li><a href="/explore">Explore</a></li>
        <li><a href="/search">Search</a></li>
      </ul>
    </div>
  );
}

export default Sidebar;
