/* eslint-disable no-unused-vars */




/**
Disables ESLint warnings for unused variables.
These variables are related to the upload song functionality, which is currently
commented out and will be re-implemented once user authentication is in place.
We need authentication to ensure that only verified users can post songs.
Once authentication is set up, we will restore the upload feature and remove this ESLint rule.
*/




import './clerk.css'; // ✅ Import clerk.css before other styles
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Home from './components/Home';
import Header from './components/Header';
import Profile from './components/Profile';
import LoginPage from './components/LoginPage';  // ✅ Import Login Page
import SignupPage from './components/SignupPage'; // ✅ Import Signup Page
import './App.css';

function App() {
  const { isSignedIn, user } = useUser(); // Use Clerk's authentication

  useEffect(() => {
    console.log("✅ Custom CSS loaded: clerk.css"); // Debugging log to verify CSS is applied
  }, []);

  return (
    <Router>
      <Header user={user} />

      <div className="app-container">
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Home />} />

          {/* Protected Profile Route: Only Accessible to Signed-In Users */}
          <Route
            path="/profile/:userId"
            element={
              <SignedIn>
                <Profile />
              </SignedIn>
            }
          />

          {/* 🔹 Load separate login and signup pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 🔹 If an unauthenticated user visits a protected route, show Login page */}
          <Route 
            path="*" 
            element={
              <SignedOut>
                <LoginPage />
              </SignedOut>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
