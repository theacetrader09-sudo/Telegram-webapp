'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      router.push('/');
    }
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/packages', label: 'Packages', icon: '💼' },
    { path: '/roi', label: 'ROI', icon: '💰' },
    { path: '/withdrawals', label: 'Withdrawals', icon: '💸' },
    { path: '/referrals', label: 'Referrals', icon: '👥' },
  ];

  return (
    <div className={`sidebar ${className}`} style={{
      width: '250px',
      minHeight: '100vh',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '20px 0',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #374151' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Investment App</h2>
      </div>

      <nav style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                color: isActive ? '#60a5fa' : '#d1d5db',
                backgroundColor: isActive ? '#1e3a8a' : 'transparent',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.2s',
                borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid #374151' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

