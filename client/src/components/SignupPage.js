// src/components/SignupPage.js
import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignupPage = () => {
  return (
    <div className="signup-container">
      <SignUp
        routing="virtual"  // Use virtual routing so the URL remains as /signup for all steps
        // Do not use the path prop when using virtual routing
        signInUrl="/login"  // ✅ Allows switching to Login
        fallbackRedirectUrl="/signup" // ✅ Fallback redirect points back to /signup after sign-up completes
        appearance={{
          variables: {
            colorPrimary: '#ff0000',            // Red primary color
            colorBackground: '#ffffff',         // White background
            colorText: '#111111',               // Dark text
            colorInputBackground: '#f0f0f0',    // Lighter input field
            colorInputText: '#111111',          // Dark text inside input
            colorInputBorder: '#ff0000',        // Red input border
            colorButtonText: '#ffffff',         // Button text color
            colorButtonBackground: '#ff0000',   // Red button background
            colorButtonBorder: '#cc0000',       // Slightly darker red border
          },
          elements: {
            // Main containers
            rootBox: "bg-white p-6 rounded-lg shadow-xl",
            card: "bg-white border border-gray-300",
            
            // Header overrides
            header: "bg-white text-black",
            headerTitle: "text-black",
            headerSubtitle: "text-black",

            // Main form area
            main: "bg-white text-black",
            form: "bg-white text-black",

            // Footer area
            footer: "bg-white text-black",

            // Buttons & fields
            primaryButton: "bg-red-500 hover:bg-red-600 text-white font-bold",
            inputField: "bg-[#f0f0f0] text-black border border-red-500 rounded-md",
          },
        }}
      />
    </div>
  );
};

export default SignupPage;
