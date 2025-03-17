import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignupPage = () => {
  return (
    <div className="signup-container">
      <h2>Sign Up Page Loaded</h2> {/* Debugging Text */}
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login" // ✅ Allows switching to Login
        fallbackRedirectUrl="/" // ✅ Redirect to home after successful sign-up
        appearance={{
          variables: {
            colorPrimary: '#ff0000', // Red primary color
            colorBackground: '#111', // Dark background
            colorText: '#ffffff', // White text
            colorInputBackground: '#333', // Darker input field
            colorInputText: '#ffffff', // White text inside input
            colorInputBorder: '#ff0000', // Red input border
            colorButtonText: '#ffffff', // Button text color
            colorButtonBackground: '#ff0000', // Red button background
            colorButtonBorder: '#cc0000', // Slightly darker red border
          },
          elements: {
            rootBox: "bg-gray-900 p-6 rounded-lg shadow-xl",
            card: "border border-gray-700 bg-gray-800",
            primaryButton: "bg-red-500 hover:bg-red-600 text-white font-bold",
            inputField: "bg-gray-700 text-white border border-red-500 rounded-md",
          },
        }}
      />
    </div>
  );
};

export default SignupPage;