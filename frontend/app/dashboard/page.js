'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ROICountdown from '../../components/ROICountdown';
import ROITransactionModal from '../../components/ROITransactionModal';
import { getUser, getROI } from '../../services/api';
import { showToast } from '../../components/Toast';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [roiSummary, setRoiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');
  const [showROIModal, setShowROIModal] = useState(false);
  const [showTeamIncomeModal, setShowTeamIncomeModal] = useState(false);

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
        backgroundColor: '#f9fafb',
        padding: '20px'
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
  const todayROI = roiSummary?.todayROI || 0;
  const totalReferrals = roiSummary?.totalReferrals || 0;
  const activePackage = roiSummary?.activePackage || null;
  const totalReferralCount = roiSummary?.totalReferralsCount || 0;
  const roiRecords = roiSummary?.roiRecords || [];

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '16px',
      paddingBottom: '80px',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      <h1 style={{ 
        marginTop: '0',
        marginBottom: '20px',
        fontSize: 'clamp(24px, 5vw, 28px)',
        fontWeight: 'bold',
        color: '#111827'
      }}>
        Dashboard
      </h1>
      
      {/* ROI Countdown Timer */}
      <div style={{ 
        marginBottom: '16px',
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%'
      }}>
        <ROICountdown />
      </div>

      {/* Wallet Balance Card */}
      <div style={{ 
        marginBottom: '16px',
        padding: '20px',
        background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: 'white',
        width: '100%'
      }}>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '12px',
          fontSize: 'clamp(16px, 4vw, 18px)',
          fontWeight: '500',
          opacity: 0.9
        }}>
          Wallet Balance
        </h2>
        <div style={{ 
          fontSize: 'clamp(32px, 8vw, 42px)', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          wordBreak: 'break-word'
        }}>
          ${balance.toFixed(2)}
        </div>
        <p style={{ 
          margin: 0, 
          opacity: 0.8,
          fontSize: 'clamp(12px, 3vw, 14px)'
        }}>
          Available for withdrawal
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
        gap: '12px',
        marginBottom: '16px',
        width: '100%'
      }}>
        {/* Active Package Card */}
        {activePackage ? (
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            width: '100%',
            color: 'white'
          }}>
            <div style={{ fontSize: '11px', marginBottom: '6px', fontWeight: '500', opacity: 0.9 }}>
              Active Package
            </div>
            <div style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: '600', marginBottom: '4px' }}>
              {activePackage.name}
            </div>
            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', opacity: 0.9 }}>
              ${activePackage.amount.toFixed(2)} • {activePackage.dailyROI}% daily
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            width: '100%'
          }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
              Active Package
            </div>
            <div style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: '500', color: '#6b7280' }}>
              No active package
            </div>
          </div>
        )}

        {/* Today's ROI Income */}
        <div style={{
          padding: '16px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          width: '100%'
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
            Today's ROI Income
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#1e40af', wordBreak: 'break-word' }}>
            ${todayROI.toFixed(2)}
          </div>
        </div>

        {/* Total ROI - Clickable */}
        <div 
          onClick={() => setShowROIModal(true)}
          style={{
            padding: '16px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            width: '100%',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
            Total ROI <span style={{ fontSize: '10px', color: '#9ca3af' }}>👆 Tap to view</span>
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#166534', wordBreak: 'break-word' }}>
            ${totalROI.toFixed(2)}
          </div>
        </div>

        {/* Team Income (Referral Income) - Clickable */}
        <div 
          onClick={() => setShowTeamIncomeModal(true)}
          style={{
            padding: '16px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            width: '100%',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
            Team Income <span style={{ fontSize: '10px', color: '#9ca3af' }}>👆 Tap to view</span>
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#92400e', wordBreak: 'break-word' }}>
            ${totalReferrals.toFixed(2)}
          </div>
        </div>

        {/* Total Referrals */}
        <div style={{
          padding: '16px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          width: '100%'
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
            Total Referrals
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#3730a3' }}>
            {totalReferralCount}
          </div>
        </div>
      </div>

      {/* Transaction Modals */}
      <ROITransactionModal
        isOpen={showROIModal}
        onClose={() => setShowROIModal(false)}
        title="Total ROI Transaction History"
        transactions={roiRecords}
        type="SELF"
      />

      <ROITransactionModal
        isOpen={showTeamIncomeModal}
        onClose={() => setShowTeamIncomeModal(false)}
        title="Team Income (Referral) Transaction History"
        transactions={roiRecords}
        type="REFERRAL"
      />

      {/* Referral Link Card */}
      <div style={{ 
        marginBottom: '16px',
        padding: '16px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        width: '100%'
      }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: '12px',
          fontSize: 'clamp(16px, 4vw, 18px)',
          fontWeight: '600',
          color: '#111827'
        }}>
          Your Referral Link
        </h3>
        <p style={{ 
          fontSize: 'clamp(12px, 3vw, 14px)', 
          color: '#6b7280', 
          marginBottom: '12px',
          lineHeight: '1.5'
        }}>
          Share this link to invite others and earn commissions from their investments
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          flexDirection: 'column',
          width: '100%'
        }}>
          <input
            type="text"
            value={referralLink}
            readOnly
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: 'clamp(12px, 3vw, 14px)',
              backgroundColor: '#f9fafb',
              color: '#111827'
            }}
          />
          <button
            onClick={copyReferralLink}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s'
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
        padding: '16px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        width: '100%'
      }}>
        <h2 style={{ 
          marginTop: 0,
          marginBottom: '12px',
          fontSize: 'clamp(16px, 4vw, 18px)',
          fontWeight: '600',
          color: '#111827'
        }}>
          Profile
        </h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Telegram ID</div>
            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '500', color: '#111827', wordBreak: 'break-word' }}>{user.telegramId}</div>
          </div>
          {user.username && (
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Username</div>
              <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '500', color: '#111827' }}>@{user.username}</div>
            </div>
          )}
          {user.firstName && (
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>First Name</div>
              <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '500', color: '#111827' }}>{user.firstName}</div>
            </div>
          )}
          {user.lastName && (
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Last Name</div>
              <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '500', color: '#111827' }}>{user.lastName}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
