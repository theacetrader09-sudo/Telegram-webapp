'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { getReferralTree } from '../../services/api';

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
        const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'YOUR_BOT_USERNAME';
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
      }
    } catch (err) {
      setError('Failed to load referral tree');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ marginLeft: '250px', padding: '20px', textAlign: 'center' }}>
          <p>Loading referral data...</p>
        </div>
      </div>
    );
  }

  const levels = referralTree?.levels || [];
  const totalReferrals = referralTree?.totalReferrals || 0;
  const totalEarnings = referralTree?.totalEarnings || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={{ 
        marginLeft: '250px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: 'calc(100% - 250px)'
      }}>
        <h1 style={{ marginTop: 0 }}>Referrals</h1>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

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
            Share this link to invite others:
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
        </div>

        {/* Referral Statistics */}
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
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Referrals</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>
              {totalReferrals}
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Earnings</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              ${totalEarnings.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Referral Tree by Levels */}
        <div style={{ marginTop: '30px' }}>
          <h2>Referral Tree (10 Levels)</h2>
          
          {levels.length > 0 ? (
            <div style={{ marginTop: '20px' }}>
              {levels.map((level, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '16px',
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, color: '#0088cc' }}>Level {index + 1}</h3>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {level.users?.length || 0} referrals
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Users</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {level.count || 0}
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Earnings</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>
                        ${(level.earnings || 0).toFixed(2)}
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Commission Rate</div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
                        {level.commissionRate || 0}%
                      </div>
                    </div>
                  </div>

                  {level.users && level.users.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Users:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {level.users.slice(0, 10).map((user, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          >
                            @{user.username || user.telegramId}
                          </span>
                        ))}
                        {level.users.length > 10 && (
                          <span style={{
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#6b7280'
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
              padding: '40px', 
              color: '#6b7280',
              marginTop: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <p>No referrals yet. Share your referral link to start earning commissions!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

