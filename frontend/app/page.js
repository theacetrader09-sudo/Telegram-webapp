'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '../services/api';

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [showTestButton, setShowTestButton] = useState(false);

  useEffect(() => {
    const handleTelegramAuth = async () => {
      try {
        // Check if already authenticated
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          // Already logged in, redirect to dashboard
          router.push('/dashboard');
          return;
        }

        // Check if running in Telegram WebApp
        if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
          setStatus('waiting');
          setShowTestButton(true);
          return;
        }

        const tg = window.Telegram.WebApp;
        tg.ready();

        // Get user from Telegram WebApp
        const tgUser = tg.initDataUnsafe?.user;
        const initData = tg.initData;

        if (!tgUser || !initData) {
          setStatus('waiting');
          setShowTestButton(true);
          return;
        }

        setStatus('authenticating');

        // Send initData to backend
        const response = await post('/auth/telegram-login', { initData });

        if (response.success) {
          // Store token and user in localStorage
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          setStatus('success');
          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          setStatus('error');
          setError(response.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setStatus('error');
        setError(err.message || 'An error occurred during authentication');
      }
    };

    handleTelegramAuth();
  }, [router]);

  const handleTestLogin = async () => {
    try {
      setStatus('authenticating');
      setError(null);

      // Simulate test user data
      const testUser = {
        id: 123456789,
        first_name: 'Test',
        username: 'testuser',
        last_name: 'User'
      };

      // Create a mock initData string (this won't validate on backend, but useful for testing UI)
      const mockInitData = `user=${encodeURIComponent(JSON.stringify(testUser))}&auth_date=${Math.floor(Date.now() / 1000)}&hash=test_hash`;

      const response = await post('/auth/telegram-login', { initData: mockInitData });

      if (response.success) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setStatus('success');
        router.push('/dashboard');
      } else {
        setStatus('error');
        setError(response.error || 'Test authentication failed. Note: This will fail without valid Telegram initData.');
      }
    } catch (err) {
      console.error('Test auth error:', err);
      setStatus('error');
      setError(err.message || 'Test authentication error');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>Telegram Web App</h1>
      
      {status === 'initializing' && (
        <p>Initializing...</p>
      )}
      
      {status === 'waiting' && (
        <div style={{ textAlign: 'center' }}>
          <p>Waiting for Telegram WebApp...</p>
          {showTestButton && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                Not in Telegram? Test with mock data:
              </p>
              <button
                onClick={handleTestLogin}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0088cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Test Login
              </button>
            </div>
          )}
        </div>
      )}
      
      {status === 'authenticating' && (
        <p>Authenticating with Telegram...</p>
      )}
      
      {status === 'success' && (
        <p>Authentication successful! Redirecting...</p>
      )}
      
      {status === 'error' && (
        <div style={{ color: 'red', textAlign: 'center', maxWidth: '400px' }}>
          <p><strong>Error:</strong> {error}</p>
          {showTestButton && (
            <button
              onClick={handleTestLogin}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: '#0088cc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Try Test Login
            </button>
          )}
        </div>
      )}
    </div>
  );
}

