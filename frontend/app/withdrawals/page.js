'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileSidebar from '../../components/MobileSidebar';
import WithdrawModal from '../../components/WithdrawModal';
import { getWithdrawals, requestWithdrawal, getUser } from '../../services/api';
import { showToast } from '../../components/Toast';

export default function Withdrawals() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        router.push('/');
        return;
      }
    };

    checkAuth();
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [withdrawalsResponse, userResponse] = await Promise.all([
        getWithdrawals(),
        getUser()
      ]);

      if (withdrawalsResponse.success) {
        setWithdrawals(withdrawalsResponse.withdrawals || []);
      } else {
        showToast(withdrawalsResponse.error || 'Failed to load withdrawals', 'error');
      }

      if (userResponse.success) {
        setWallet(userResponse.wallet);
      } else {
        showToast(userResponse.error || 'Failed to load wallet', 'error');
      }
    } catch (err) {
      setError('Failed to load data');
      showToast('Failed to load data', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount) => {
    try {
      const response = await requestWithdrawal(amount);
      if (response.success) {
        showToast('Withdrawal request submitted successfully!', 'success');
        setShowModal(false);
        loadData();
      } else {
        showToast(response.error || 'Failed to request withdrawal', 'error');
        throw new Error(response.error || 'Failed to request withdrawal');
      }
    } catch (err) {
      showToast(err.message || 'Failed to request withdrawal', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: '#fef3c7', color: '#92400e' },
      COMPLETED: { bg: '#d1fae5', color: '#065f46' },
      REJECTED: { bg: '#fee2e2', color: '#991b1b' },
      APPROVED: { bg: '#dbeafe', color: '#1e40af' }
    };

    const style = styles[status] || styles.PENDING;

    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {status}
      </span>
    );
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
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading withdrawals...</p>
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

  const balance = wallet?.balance || 0;
  const minWithdrawal = 10;

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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '60px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{ 
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Withdrawals
          </h1>
          <button
            onClick={() => setShowModal(true)}
            disabled={balance < minWithdrawal}
            style={{
              padding: '12px 24px',
              background: balance < minWithdrawal 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                : 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: balance < minWithdrawal ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s',
              opacity: balance < minWithdrawal ? 0.6 : 1
            }}
            onMouseDown={(e) => balance >= minWithdrawal && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Request Withdrawal
          </button>
        </div>

        {balance < minWithdrawal && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #fde68a'
          }}>
            Minimum withdrawal amount is ${minWithdrawal}. Your current balance: ${balance.toFixed(2)}
          </div>
        )}

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

        {/* Wallet Balance */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          color: 'white'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>
            Available Balance
          </div>
          <div style={{ fontSize: '42px', fontWeight: 'bold' }}>
            ${balance.toFixed(2)}
          </div>
        </div>

        {/* Withdrawals Table */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ 
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827'
            }}>
              Withdrawal History
            </h2>
          </div>
          
          {withdrawals.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Request Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal, index) => (
                    <tr key={withdrawal.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '16px', color: '#111827' }}>
                        ${withdrawal.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '14px' }}>
                        {new Date(withdrawal.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#6b7280'
            }}>
              <p style={{ fontSize: '16px', margin: 0 }}>No withdrawal requests yet.</p>
            </div>
          )}
        </div>

        {showModal && wallet && (
          <WithdrawModal
            balance={balance}
            onClose={() => setShowModal(false)}
            onWithdraw={handleWithdraw}
          />
        )}
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
          table {
            font-size: 12px;
          }
          th, td {
            padding: 8px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
