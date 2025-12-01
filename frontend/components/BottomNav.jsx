'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BottomNav() {
  const pathname = usePathname();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/packages', label: 'Packages', icon: '💼' },
    { path: '/roi', label: 'ROI', icon: '💰' },
    { path: '/withdrawals', label: 'Withdraw', icon: '💸' },
    { path: '/referrals', label: 'Referrals', icon: '👥' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
        zIndex: 1000,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
        minHeight: '60px',
        maxHeight: '60px'
      }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? '#0088cc' : '#6b7280',
                padding: '4px 8px',
                borderRadius: '8px',
                minWidth: '50px',
                flex: 1,
                transition: 'all 0.2s',
                fontSize: '10px',
                fontWeight: isActive ? '600' : '400',
                maxWidth: '80px'
              }}
            >
              <span style={{ 
                fontSize: '22px', 
                marginBottom: '2px',
                lineHeight: '1'
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: '11px',
                lineHeight: '1.2',
                textAlign: 'center',
                wordBreak: 'break-word'
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <style jsx>{`
        nav {
          -webkit-tap-highlight-color: transparent;
        }
        @media (max-width: 480px) {
          nav {
            padding: '6px 0';
          }
          nav span:last-child {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}

