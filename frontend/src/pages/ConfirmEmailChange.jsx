import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as authAPI from '../api/auth';

export const ConfirmEmailChange = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Confirming email change...');
  const [error, setError] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const confirm = async () => {
      try {
        await authAPI.confirmEmailChange(token);
        setMessage('Email confirmed successfully! Redirecting to profile...');
        setTimeout(() => navigate('/profile'), 2000);
      } catch (err) {
        setError(true);
        setMessage(err.response?.data?.detail || 'Failed to confirm email');
      }
    };

    if (token) {
      confirm();
    } else {
      setError(true);
      setMessage('No confirmation token provided');
    }
  }, [token, navigate]);

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
      <h1>Email Confirmation</h1>
      <div style={{ color: error ? '#dc3545' : '#28a745', marginTop: '1rem' }}>
        {message}
      </div>
    </div>
  );
};
