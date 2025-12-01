'use client';

import { useEffect, useState } from 'react';

export default function CelebrationAnimation({ onClose, message = "Congratulations! Your package is activated!" }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.3s'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '24px',
          padding: '40px 30px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          maxWidth: '90%',
          animation: 'scaleIn 0.3s'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          fontSize: '64px',
          marginBottom: '20px',
          animation: 'bounce 1s infinite'
        }}>
          🎉
        </div>
        <h2 style={{
          margin: '0 0 12px 0',
          fontSize: 'clamp(20px, 5vw, 28px)',
          fontWeight: 'bold'
        }}>
          {message}
        </h2>
        <p style={{
          margin: 0,
          fontSize: 'clamp(14px, 3.5vw, 16px)',
          opacity: 0.9
        }}>
          Your investment package is now active!
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.8);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

