
/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Header from './components/Header';
import Profile from './components/Profile'; // Create this for the user profile page
import './App.css';

function App() {
  const [user, setUser] = useState(null); // Set user to null initially

  return (
    <Router>
      {/* Put the header outside .app-container */}
      <Header user={user} />
      
      {/* The rest of your page is in .app-container */}
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
