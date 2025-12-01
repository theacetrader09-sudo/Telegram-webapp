'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileSidebar from '../../components/MobileSidebar';
import { getReferralTree } from '../../services/api';
import { showToast } from '../../components/Toast';

export default function Referrals() {
  const router = useRouter();
  const [referralTree, setReferralTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken || !storedUser) {
        router.push('/');
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'Atherdy_bot';
        const refCode = `REF_${userData.id}`;
        setReferralLink(`https://t.me/${botUsername}?start=${refCode}`);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    };

    checkAuth();
    loadReferralTree();
  }, [router]);

  const loadReferralTree = async () => {
    try {
      const response = await getReferralTree();
      if (response.success) {
        setReferralTree(response);
      } else {
        setError(response.error || 'Failed to load referral tree');
        showToast(response.error || 'Failed to load referral tree', 'error');
      }
    } catch (err) {
      setError('Failed to load referral tree');
      showToast('Failed to load referral tree', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading referral data...</p>
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

  const levels = referralTree?.levels || [];
  const totalReferrals = referralTree?.totalReferrals || 0;
  const totalEarnings = referralTree?.totalEarnings || 0;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex'
    }}>
      <div style={{ display: 'none' }}>
        <Sidebar />
      </div>
      <div style={{ display: 'block' }}>
        <MobileSidebar />
      </div>
      
      <div style={{ 
        flex: 1,
        marginLeft: 0,
        padding: '20px',
        width: '100%',
        maxWidth: '100%'
      }}>
        <h1 style={{ 
          marginTop: '60px',
          marginBottom: '24px',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#111827'
        }}>
          Referrals
        </h1>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Referral Link Card */}
        <div style={{ 
          marginBottom: '24px',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          color: 'white'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '12px',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Your Referral Link
          </h3>
          <p style={{ 
            fontSize: '14px', 
            opacity: 0.9, 
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
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            />
            <button
              onClick={copyReferralLink}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#667eea',
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

        {/* Referral Statistics */}
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
              Total Referrals
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
              {totalReferrals}
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
              Total Earnings
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              ${totalEarnings.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Referral Tree by Levels */}
        <div style={{ marginTop: '24px' }}>
          <h2 style={{
            marginBottom: '20px',
            fontSize: '22px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Referral Tree (10 Levels)
          </h2>
          
          {levels.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {levels.map((level, index) => (
                <div
                  key={index}
                  style={{
                    padding: '20px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: '#0088cc',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      Level {level.level}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                      {level.count || 0} referrals
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Users</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                        {level.count || 0}
                      </div>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '12px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Earnings</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>
                        ${(level.earnings || 0).toFixed(2)}
                      </div>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '12px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Commission</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
                        {level.commissionRate || 0}%
                      </div>
                    </div>
                  </div>

                  {level.users && level.users.length > 0 && (
                    <div style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #e5e7eb' 
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6b7280', 
                        marginBottom: '12px',
                        fontWeight: '500'
                      }}>
                        Users:
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px' 
                      }}>
                        {level.users.slice(0, 10).map((user, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#111827'
                            }}
                          >
                            @{user.username || user.telegramId}
                          </span>
                        ))}
                        {level.users.length > 10 && (
                          <span style={{
                            padding: '8px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            +{level.users.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#6b7280',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{ fontSize: '16px', margin: 0 }}>
                No referrals yet. Share your referral link to start earning commissions!
              </p>
            </div>
          )}
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
