'use client';

import { useEffect, useState } from 'react';

let toastId = 0;
const toasts = [];
const listeners = [];

export const showToast = (message, type = 'info', duration = 3000) => {
  const id = toastId++;
  const toast = { id, message, type, duration };
  toasts.push(toast);
  listeners.forEach(listener => listener([...toasts]));
  
  setTimeout(() => {
    removeToast(id);
  }, duration);
  
  return id;
};

export const removeToast = (id) => {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach(listener => listener([...toasts]));
  }
};

export default function ToastContainer() {
  const [toastList, setToastList] = useState([]);

  useEffect(() => {
    listeners.push(setToastList);
    return () => {
      const index = listeners.indexOf(setToastList);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: 'calc(100vw - 40px)'
    }}>
      {toastList.map(toast => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            padding: '12px 16px',
            backgroundColor: toast.type === 'success' ? '#10b981' : 
                           toast.type === 'error' ? '#ef4444' : 
                           toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            minWidth: '200px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {toast.message}
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

