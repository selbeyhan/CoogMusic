import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerifyEmailRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Wait 3 seconds before redirecting back to /signup
    const timer = setTimeout(() => {
      navigate("/signup");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Email Verification</h1>
      <p>
        A verification link was sent to your email address.
        Please check your inbox.
        You will be redirected back shortly.
      </p>
    </div>
  );
};

export default VerifyEmailRedirect;