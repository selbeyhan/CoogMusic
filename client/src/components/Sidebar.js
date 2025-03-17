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
      <ul className="sidebar-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/about">About</a></li>
        <li><a href= "/random">These Are Just Placeholders</a></li>
      </ul>
    </div>
  );
}

export default Sidebar;
