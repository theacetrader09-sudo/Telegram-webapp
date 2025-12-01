'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileSidebar from '../../components/MobileSidebar';
import ROICountdown from '../../components/ROICountdown';
import { getUser, getROI } from '../../services/api';
import { showToast } from '../../components/Toast';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [roiSummary, setRoiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        router.push('/');
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'Atherdy_bot';
        const refCode = `REF_${userData.id}`;
        setReferralLink(`https://t.me/${botUsername}?start=${refCode}`);

        const userResponse = await getUser();
        if (userResponse.success) {
          setWallet(userResponse.wallet);
        } else {
          showToast(userResponse.error || 'Failed to load wallet', 'error');
        }

        const roiResponse = await getROI();
        if (roiResponse.success) {
          setRoiSummary(roiResponse);
        } else {
          showToast(roiResponse.error || 'Failed to load ROI data', 'error');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        showToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  }, [router]);

  const copyReferralLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      showToast('Referral link copied!', 'success');
    } else {
      showToast('Failed to copy link', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #0088cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const balance = wallet?.balance || 0;
  const totalROI = roiSummary?.totalROI || 0;
  const totalReferrals = roiSummary?.totalReferrals || 0;
  const totalDeposits = roiSummary?.totalDeposits || 0;
  const activeDeposits = roiSummary?.activeDeposits || 0;
  const totalReferralCount = roiSummary?.totalReferralsCount || 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex'
    }}>
      {/* Desktop Sidebar */}
      <div style={{ display: 'none' }}>
        <Sidebar />
      </div>
      <style jsx>{`
        @media (min-width: 769px) {
          div[style*="display: none"] {
            display: block !important;
          }
        }
      `}</style>
      
      {/* Mobile Sidebar */}
      <div style={{ display: 'block' }}>
        <MobileSidebar />
      </div>
      <style jsx>{`
        @media (min-width: 769px) {
          div[style*="display: block"]:has(+ style) {
            display: none !important;
          }
        }
      `}</style>
      
      <div style={{ 
        flex: 1,
        marginLeft: 0,
        padding: '20px',
        width: '100%',
        maxWidth: '100%'
      }}>
        <style jsx>{`
          @media (min-width: 769px) {
            div {
              marginLeft: '250px' !important;
              width: 'calc(100% - 250px)' !important;
            }
          }
        `}</style>
        
        <h1 style={{ 
          marginTop: '60px',
          marginBottom: '24px',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#111827'
        }}>
          Dashboard
        </h1>
        
        {/* ROI Countdown Timer */}
        <div style={{ 
          marginBottom: '24px',
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <ROICountdown />
        </div>

        {/* Wallet Balance Card */}
        <div style={{ 
          marginBottom: '24px',
          padding: '24px',
          background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          color: 'white'
        }}>
          <h2 style={{ 
            marginTop: 0, 
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '500',
            opacity: 0.9
          }}>
            Wallet Balance
          </h2>
          <div style={{ 
            fontSize: '42px', 
            fontWeight: 'bold', 
            marginBottom: '8px'
          }}>
            ${balance.toFixed(2)}
          </div>
          <p style={{ 
            margin: 0, 
            opacity: 0.8,
            fontSize: '14px'
          }}>
            Available for withdrawal
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
              Total Deposits
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
              ${totalDeposits.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
              Total ROI
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
              ${totalROI.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
              Referral Income
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
              ${totalReferrals.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
              Active Deposits
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9f1239' }}>
              {activeDeposits}
            </div>
          </div>

          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
              Total Referrals
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3730a3' }}>
              {totalReferralCount}
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        <div style={{ 
          marginBottom: '24px',
          padding: '20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '12px',
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Your Referral Link
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            Share this link to invite others and earn commissions from their investments
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            flexDirection: 'column'
          }}>
            <input
              type="text"
              value={referralLink}
              readOnly
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                color: '#111827'
              }}
            />
            <button
              onClick={copyReferralLink}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s',
                width: '100%'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div style={{ 
          padding: '20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            marginTop: 0,
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Profile
          </h2>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Telegram ID</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{user.telegramId}</div>
            </div>
            {user.username && (
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Username</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>@{user.username}</div>
              </div>
            )}
            {user.firstName && (
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>First Name</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{user.firstName}</div>
              </div>
            )}
            {user.lastName && (
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Last Name</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{user.lastName}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 769px) {
          div[style*="marginLeft: 0"] {
            margin-left: 250px !important;
            width: calc(100% - 250px) !important;
          }
          div[style*="marginTop: '60px'"] {
            margin-top: 20px !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
