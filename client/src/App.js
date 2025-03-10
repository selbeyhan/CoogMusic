// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Header from './components/Header';
import Profile from './components/Profile'; // Create this for the user profile page
import './App.css';

function App() {
  // Replace with actual user data from context or props
  const user = {
    user_id: "user123",
    profilePictureUrl: "https://via.placeholder.com/150"
  };

  return (
    <Router>
      <div className="app-container">
        <Header user={user} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
