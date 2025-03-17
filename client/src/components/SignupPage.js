import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignupPage = () => {
  return (
    <div className="signup-container">
      <SignUp
        routing="path"
        path="/signup"
        appearance={{
          variables: {
            colorPrimary: '#ff0000',
            colorBackground: '#111',
            colorText: '#ffffff',
            colorInputBackground: '#333',
            colorInputText: '#ffffff',
            colorInputBorder: '#ff0000',
            colorButtonText: '#ffffff',
            colorButtonBackground: '#ff0000',
            colorButtonBorder: '#cc0000',
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
