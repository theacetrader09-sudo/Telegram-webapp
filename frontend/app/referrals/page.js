'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
        Referrals
      </h1>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #fecaca',
          fontSize: 'clamp(12px, 3vw, 14px)'
        }}>
          {error}
        </div>
      )}

      {/* Referral Link Card */}
      <div style={{ 
        marginBottom: '20px',
        padding: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: 'white',
        width: '100%'
      }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: '12px',
          fontSize: 'clamp(16px, 4vw, 20px)',
          fontWeight: '600'
        }}>
          Your Referral Link
        </h3>
        <p style={{ 
          fontSize: 'clamp(12px, 3vw, 14px)', 
          opacity: 0.9, 
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
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: 'clamp(11px, 3vw, 14px)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              backdropFilter: 'blur(10px)'
            }}
          />
          <button
            onClick={copyReferralLink}
            style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#667eea',
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

      {/* Referral Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
        gap: '12px',
        marginBottom: '20px',
        width: '100%'
      }}>
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
          <div style={{ fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 'bold', color: '#1e40af' }}>
            {totalReferrals}
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          width: '100%'
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
            Total Earnings
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 'bold', color: '#166534', wordBreak: 'break-word' }}>
            ${totalEarnings.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Referral Tree by Levels */}
      <div style={{ marginTop: '20px' }}>
        <h2 style={{
          marginBottom: '16px',
          fontSize: 'clamp(18px, 4vw, 22px)',
          fontWeight: '600',
          color: '#111827'
        }}>
          Referral Tree (10 Levels)
        </h2>
        
        {levels.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {levels.map((level, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  width: '100%'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    color: '#0088cc',
                    fontSize: 'clamp(16px, 4vw, 18px)',
                    fontWeight: '600'
                  }}>
                    Level {level.level}
                  </h3>
                  <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#6b7280', fontWeight: '500' }}>
                    {level.count || 0} referrals
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100px, 100%), 1fr))',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Users</div>
                    <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold', color: '#111827' }}>
                      {level.count || 0}
                    </div>
                  </div>

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Earnings</div>
                    <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold', color: '#166534', wordBreak: 'break-word' }}>
                      ${(level.earnings || 0).toFixed(2)}
                    </div>
                  </div>

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Commission</div>
                    <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold', color: '#92400e' }}>
                      {level.commissionRate || 0}%
                    </div>
                  </div>
                </div>

                {level.users && level.users.length > 0 && (
                  <div style={{ 
                    marginTop: '12px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid #e5e7eb' 
                  }}>
                    <div style={{ 
                      fontSize: 'clamp(11px, 3vw, 14px)', 
                      color: '#6b7280', 
                      marginBottom: '8px',
                      fontWeight: '500'
                    }}>
                      Users:
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px' 
                    }}>
                      {level.users.slice(0, 8).map((user, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '8px',
                            fontSize: 'clamp(10px, 2.5vw, 12px)',
                            fontWeight: '500',
                            color: '#111827'
                          }}
                        >
                          @{user.username || user.telegramId}
                        </span>
                      ))}
                      {level.users.length > 8 && (
                        <span style={{
                          padding: '6px 10px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '8px',
                          fontSize: 'clamp(10px, 2.5vw, 12px)',
                          color: '#6b7280',
                          fontWeight: '500'
                        }}>
                          +{level.users.length - 8} more
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
            <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', margin: 0 }}>
              No referrals yet. Share your referral link to start earning commissions!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
