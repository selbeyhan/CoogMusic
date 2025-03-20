// src/components/HamburgerIcon.js
import React from 'react';
import './HamburgerIcon.css';

function HamburgerIcon({ onClick }) {
  return (
    <div className="hamburger-icon" onClick={onClick}>
      <div className="bar" />
      <div className="bar" />
      <div className="bar" />
    </div>
  );
}

export default HamburgerIcon;
