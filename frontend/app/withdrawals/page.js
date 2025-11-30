'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import WithdrawModal from '../../components/WithdrawModal';
import { getWithdrawals, requestWithdrawal, getUser } from '../../services/api';

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
      }

      if (userResponse.success) {
        setWallet(userResponse.wallet);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount) => {
    const response = await requestWithdrawal(amount);
    if (response.success) {
      alert('Withdrawal request submitted successfully!');
      setShowModal(false);
      loadData(); // Reload data
    } else {
      throw new Error(response.error || 'Failed to request withdrawal');
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
        padding: '4px 12px',
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
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ marginLeft: '250px', padding: '20px', textAlign: 'center' }}>
          <p>Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  const balance = wallet?.balance || 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={{ 
        marginLeft: '250px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: 'calc(100% - 250px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ marginTop: 0 }}>Withdrawals</h1>
          <button
            onClick={() => setShowModal(true)}
            disabled={balance < 10}
            style={{
              padding: '12px 24px',
              backgroundColor: balance < 10 ? '#9ca3af' : '#0088cc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: balance < 10 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Request Withdrawal
          </button>
        </div>

        {balance < 10 && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            Minimum withdrawal amount is $10. Your current balance: ${balance.toFixed(2)}
          </div>
        )}

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

        {/* Wallet Balance */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Available Balance</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0088cc' }}>
            ${balance.toFixed(2)}
          </div>
        </div>

        {/* Withdrawals Table */}
        <div>
          <h2>Withdrawal History</h2>
          
          {withdrawals.length > 0 ? (
            <div style={{
              marginTop: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Request Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Processed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal, index) => (
                    <tr key={withdrawal.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>
                        ${withdrawal.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>
                        {withdrawal.approvedAt 
                          ? new Date(withdrawal.approvedAt).toLocaleDateString()
                          : withdrawal.status === 'REJECTED' && withdrawal.rejectedAt
                          ? new Date(withdrawal.rejectedAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <p>No withdrawal requests yet.</p>
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
    </div>
  );
}

