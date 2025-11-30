'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ROICountdown from '../../components/ROICountdown';
import { getUser, getROI } from '../../services/api';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [roiSummary, setRoiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    const loadData = async () => {
      // Check authentication
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        router.push('/');
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Generate referral link
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'YOUR_BOT_USERNAME';
        const refCode = `REF_${userData.id}`;
        setReferralLink(`https://t.me/${botUsername}?start=${refCode}`);

        // Fetch user with wallet
        const userResponse = await getUser();
        if (userResponse.success) {
          setWallet(userResponse.wallet);
        }

        // Fetch ROI summary
        const roiResponse = await getROI();
        if (roiResponse.success) {
          setRoiSummary(roiResponse);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Initialize Telegram WebApp if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
    }
  }, [router]);

  const copyReferralLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        marginLeft: '250px'
      }}>
        <p>Loading...</p>
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={{ 
        marginLeft: '250px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: 'calc(100% - 250px)'
      }}>
        <h1 style={{ marginTop: 0 }}>Dashboard</h1>
        
        {/* ROI Countdown Timer */}
        <div style={{ marginTop: '20px' }}>
          <ROICountdown />
        </div>

        {/* Wallet Balance Card */}
        <div style={{ 
          marginTop: '20px',
          padding: '24px',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Wallet Balance</h2>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0088cc', marginBottom: '8px' }}>
            ${balance.toFixed(2)}
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>Available for withdrawal</p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '20px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Deposits</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
              ${totalDeposits.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total ROI</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
              ${totalROI.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Referral Income</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
              ${totalReferrals.toFixed(2)}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fce7f3',
            border: '1px solid #fbcfe8',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Active Deposits</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9f1239' }}>
              {activeDeposits}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#e0e7ff',
            border: '1px solid #c7d2fe',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Referrals</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3730a3' }}>
              {totalReferralCount}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div style={{ 
          marginTop: '20px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h2 style={{ marginTop: 0 }}>Profile</h2>
          <div style={{ marginTop: '15px' }}>
            <p><strong>Telegram ID:</strong> {user.telegramId}</p>
            {user.username && (
              <p><strong>Username:</strong> @{user.username}</p>
            )}
            {user.firstName && (
              <p><strong>First Name:</strong> {user.firstName}</p>
            )}
            {user.lastName && (
              <p><strong>Last Name:</strong> {user.lastName}</p>
            )}
          </div>
        </div>

        {/* Referral Link */}
        <div style={{ 
          marginTop: '20px',
          padding: '20px',
          border: '1px solid #0088cc',
          borderRadius: '8px',
          backgroundColor: '#e3f2fd'
        }}>
          <h3 style={{ marginTop: 0 }}>Your Referral Link</h3>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
            Share this link to invite others and earn commissions:
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              value={referralLink}
              readOnly
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={copyReferralLink}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0088cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Copy
            </button>
          </div>
          {user.referralChain && user.referralChain.length > 0 && (
            <p style={{ marginTop: '10px', fontSize: '0.85em', color: '#666' }}>
              Referred by: {user.referralChain.join(' → ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
