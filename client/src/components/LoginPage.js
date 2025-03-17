import React, { useEffect } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom'; // ✅ Import useNavigate for programmatic navigation

const LoginPage = () => {
  const navigate = useNavigate(); // ✅ Initialize useNavigate

  useEffect(() => {
    console.log("✅ SignIn Component should load now.");
  }, []);

  return (
    <div className="login-container">
      <h2>Login Page Loaded</h2> {/* Debugging Text */}
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup" // ✅ Allows switching to SignUp
        fallbackRedirectUrl="/" // ✅ Redirect to home after successful sign-in
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

export default LoginPage;