import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import './Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const { isSignedIn, user } = useUser();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Optional close button */}
      <button className="close-btn" onClick={onClose}>
        &times;
      </button>

      <ul className="sidebar-menu">
        <li><Link to="/" onClick={onClose}>Home</Link></li>
        {isSignedIn && (
          <li><Link to={`/profile/${user.id}`} onClick={onClose}>Profile</Link></li>
        )}
        <li><Link to="/about" onClick={onClose}>About</Link></li>
        <li><Link to="/explore" onClick={onClose}>Explore</Link></li>
        <li><Link to="/search" onClick={onClose}>Search</Link></li>
      </ul>
    </div>
  );
}

export default Sidebar;