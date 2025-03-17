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
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
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
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
