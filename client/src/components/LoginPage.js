import React, { useEffect } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("✅ SignIn Component should load now.");
  }, []);

  return (
    <div className="login-container">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        fallbackRedirectUrl="/"
        appearance={{
          variables: {
            colorPrimary: '#ff0000',
            colorBackground: '#ffffff',   // White background
            colorText: '#111111',         // Dark text
            colorInputBackground: '#f0f0f0',
            colorInputText: '#111111',
            colorInputBorder: '#ff0000',
            colorButtonText: '#ffffff',
            colorButtonBackground: '#ff0000',
            colorButtonBorder: '#cc0000',
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

export default LoginPage;
