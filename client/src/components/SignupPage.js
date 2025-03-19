// src/components/SignupPage.js
import React, { useEffect } from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignupPage = () => {
  useEffect(() => {
    if (window.Clerk) {
      window.Clerk.load();  // ✅ Forces Clerk to reload if missing
    }
  }, []);

  return (
    <div className="signup-container">
      <SignUp
        routing="virtual"  // ✅ Keeps all steps under /signup
        signInUrl="/login"
        fallbackRedirectUrl="/" // ✅ Redirect to home if there's an issue
        afterSignUpUrl="/" // ✅ Redirects to home after successful sign-up
        afterSignInUrl="/" // ✅ Ensures signed-in users go to home
        appearance={{
          variables: {
            colorPrimary: '#ff0000',
            colorBackground: '#ffffff',
            colorText: '#111111',
            colorInputBackground: '#f0f0f0',
            colorInputText: '#111111',
            colorInputBorder: '#ff0000',
            colorButtonText: '#ffffff',
            colorButtonBackground: '#ff0000',
            colorButtonBorder: '#cc0000',
          },
          elements: {
            rootBox: "bg-white p-6 rounded-lg shadow-xl",
            card: "bg-white border border-gray-300",
            header: "bg-white text-black",
            headerTitle: "text-black",
            headerSubtitle: "text-black",
            main: "bg-white text-black",
            form: "bg-white text-black",
            footer: "bg-white text-black",
            primaryButton: "bg-red-500 hover:bg-red-600 text-white font-bold",
            inputField: "bg-[#f0f0f0] text-black border border-red-500 rounded-md",
          },
        }}
      />
    </div>
  );
};

export default SignupPage;
