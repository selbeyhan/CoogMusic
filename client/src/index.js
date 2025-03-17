import './clerk.css'; // ✅ Ensure Clerk styles are applied first
import './index.css'; // ✅ Ensure global styles are applied after Clerk styles

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import reportWebVitals from './reportWebVitals';

const clerkPubKey = process.env.REACT_APP_CLERK_FRONTEND_API; // Ensure this is set in .env

// Debugging logs to verify Clerk API key and appearance settings
console.log("✅ Clerk Publishable Key:", clerkPubKey);
console.log("✅ Clerk Appearance Config Loaded:", {
  variables: {
    colorPrimary: '#ff0000', // Red primary color
    colorBackground: '#ffffff', // Changed from #111 to #ffffff (White background)
    colorText: '#111111', // Changed from #ffffff to #111111 (Dark text)
    colorInputBackground: '#f0f0f0', // Lighter input field
    colorInputText: '#111111', // Changed from #ffffff to #111111 (Dark text)
    colorInputBorder: '#ff0000', // Red input border
    colorButtonText: '#ffffff', // Button text color
    colorButtonBackground: '#ff0000', // Red button background
    colorButtonBorder: '#cc0000', // Slightly darker red border
  },
  elements: {
    rootBox: "bg-white p-6 rounded-lg shadow-xl", // Changed from bg-gray-900 to bg-white
    card: "border border-gray-300 bg-white",      // Changed from bg-gray-800 to bg-white
    primaryButton: "bg-red-500 hover:bg-red-600 text-white font-bold",
    inputField: "bg-[#f0f0f0] text-black border border-red-500 rounded-md", // Updated for a lighter field
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        variables: {
          colorPrimary: '#ff0000', // Red primary color
          colorBackground: '#ffffff', // Changed from #111 to #ffffff (White background)
          colorText: '#111111', // Changed from #ffffff to #111111 (Dark text)
          colorInputBackground: '#f0f0f0', // Lighter input field
          colorInputText: '#111111', // Changed from #ffffff to #111111 (Dark text)
          colorInputBorder: '#ff0000', // Red input border
          colorButtonText: '#ffffff', // Button text color
          colorButtonBackground: '#ff0000', // Red button background
          colorButtonBorder: '#cc0000', // Slightly darker red border
        },
        elements: {
          rootBox: "bg-white p-6 rounded-lg shadow-xl", // Changed from bg-gray-900 to bg-white
          card: "border border-gray-300 bg-white",      // Changed from bg-gray-800 to bg-white
          primaryButton: "bg-red-500 hover:bg-red-600 text-white font-bold",
          inputField: "bg-[#f0f0f0] text-black border border-red-500 rounded-md", // Updated for a lighter field
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
