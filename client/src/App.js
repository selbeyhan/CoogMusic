/* eslint-disable no-unused-vars */
// remove in prod

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import Home from './components/Home';
import Header from './components/Header';
import Profile from './components/Profile';
import './App.css';

function App() {
  const { isSignedIn, user } = useUser(); // Use Clerk's authentication

  return (
    <Router>
      {/* Header should not depend on the user state manually */}
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

          {/* Redirect unauthenticated users to Sign In */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Catch-all route: Redirect to Sign In if trying to access a restricted page */}
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
