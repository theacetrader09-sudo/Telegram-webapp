'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createDepositRequest, getPendingDeposits, getUserDeposits, getUser } from '../../services/api';
import { showToast } from '../../components/Toast';

const WALLET_ADDRESS = '0xDa51B37Bf7872f9adeF99eC99365d0673D027E72';
const NETWORK = 'BEP20';

export default function Deposit() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [approvedDeposits, setApprovedDeposits] = useState([]);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

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
      const [userResponse, pendingResponse, approvedResponse] = await Promise.all([
        getUser(),
        getPendingDeposits(),
        getUserDeposits()
      ]);

      if (userResponse.success) {
        setWallet(userResponse.wallet);
      }

      if (pendingResponse.success) {
        setPendingDeposits(pendingResponse.deposits || []);
      }

      if (approvedResponse.success) {
        setApprovedDeposits(approvedResponse.deposits || []);
        setTotalDeposited(approvedResponse.totalDeposited || 0);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const copyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(WALLET_ADDRESS);
      showToast('Wallet address copied!', 'success');
    } else {
      showToast('Failed to copy address', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await createDepositRequest(
        parseFloat(amount),
        depositAddress || null,
        null
      );

      if (response.success) {
        showToast('Deposit request submitted! Waiting for admin approval.', 'success');
        setAmount('');
        setDepositAddress('');
        loadData(); // Reload pending deposits
      } else {
        showToast(response.error || 'Failed to submit deposit request', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit deposit request', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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

  const balance = wallet?.balance || 0;

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
        Deposit Funds
      </h1>

      {/* Current Balance */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
        borderRadius: '16px',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: 'white',
        width: '100%'
      }}>
        <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>
          Current Balance
        </div>
        <div style={{ fontSize: 'clamp(32px, 8vw, 42px)', fontWeight: 'bold', wordBreak: 'break-word' }}>
          ${balance.toFixed(2)}
        </div>
      </div>

      {/* Wallet Address Card */}
      <div style={{ 
        marginBottom: '20px',
        padding: '20px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        width: '100%'
      }}>
        <h2 style={{ 
          marginTop: 0,
          marginBottom: '12px',
          fontSize: 'clamp(18px, 4vw, 20px)',
          fontWeight: '600',
          color: '#111827'
        }}>
          Deposit Wallet Address
        </h2>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '12px',
          marginBottom: '12px',
          fontSize: 'clamp(11px, 3vw, 12px)',
          color: '#6b7280',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          Network: {NETWORK}
        </div>

        {/* QR Code */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <QRCodeSVG
            value={WALLET_ADDRESS}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          marginBottom: '12px',
          border: '1px solid #e5e7eb',
          wordBreak: 'break-all',
          fontSize: 'clamp(12px, 3vw, 14px)',
          fontFamily: 'monospace',
          color: '#111827',
          textAlign: 'center'
        }}>
          {WALLET_ADDRESS}
        </div>

        <button
          onClick={copyAddress}
          style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Copy Address
        </button>
      </div>

      {/* Deposit Form */}
      <div style={{ 
        marginBottom: '20px',
        padding: '20px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        width: '100%'
      }}>
        <h2 style={{ 
          marginTop: 0,
          marginBottom: '16px',
          fontSize: 'clamp(18px, 4vw, 20px)',
          fontWeight: '600',
          color: '#111827'
        }}>
          Submit Deposit Request
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: 'clamp(13px, 3.5vw, 14px)',
              color: '#111827'
            }}>
              Deposit Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              placeholder="Enter amount"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: 'clamp(13px, 3.5vw, 14px)',
              color: '#111827'
            }}>
              Transaction Hash (Optional)
            </label>
            <input
              type="text"
              value={depositAddress}
              onChange={(e) => setDepositAddress(e.target.value)}
              placeholder="Enter transaction hash if available"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: 'clamp(12px, 3vw, 14px)',
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
            />
            <p style={{
              marginTop: '6px',
              fontSize: 'clamp(11px, 2.5vw, 12px)',
              color: '#6b7280'
            }}>
              Optional: Provide your transaction hash for faster verification
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                : 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s',
              opacity: loading ? 0.7 : 1
            }}
            onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? 'Submitting...' : 'Submit Deposit Request'}
          </button>
        </form>
      </div>

      {/* Total Deposited Summary */}
      {totalDeposited > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          color: 'white',
          width: '100%'
        }}>
          <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>
            Total Deposited
          </div>
          <div style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: 'bold', wordBreak: 'break-word' }}>
            ${totalDeposited.toFixed(2)}
          </div>
          <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', opacity: 0.8, marginTop: '4px' }}>
            {approvedDeposits.length} approved deposit{approvedDeposits.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Approved Deposits */}
      {approvedDeposits.length > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          width: '100%'
        }}>
          <h2 style={{ 
            marginTop: 0,
            marginBottom: '16px',
            fontSize: 'clamp(18px, 4vw, 20px)',
            fontWeight: '600',
            color: '#111827'
          }}>
            Approved Deposits
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {approvedDeposits.map((deposit) => (
              <div
                key={deposit.id}
                style={{
                  padding: '16px',
                  backgroundColor: deposit.status === 'ACTIVE' ? '#d1fae5' : '#f0fdf4',
                  borderRadius: '12px',
                  border: `1px solid ${deposit.status === 'ACTIVE' ? '#86efac' : '#bbf7d0'}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600', color: '#065f46' }}>
                    ${deposit.amount.toFixed(2)}
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: deposit.status === 'ACTIVE' ? '#10b981' : '#6ee7b7',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: 'clamp(11px, 2.5vw, 12px)',
                    fontWeight: '500'
                  }}>
                    {deposit.status}
                  </span>
                </div>
                {deposit.package && (
                  <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#047857', marginBottom: '4px' }}>
                    Package: {deposit.package.name} ({deposit.package.dailyROI}% daily)
                  </div>
                )}
                <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#6b7280' }}>
                  {deposit.status === 'APPROVED' ? 'Approved' : 'Activated'}: {new Date(deposit.approvedAt || deposit.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Deposits */}
      {pendingDeposits.length > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          width: '100%'
        }}>
          <h2 style={{ 
            marginTop: 0,
            marginBottom: '16px',
            fontSize: 'clamp(18px, 4vw, 20px)',
            fontWeight: '600',
            color: '#111827'
          }}>
            Pending Deposits
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingDeposits.map((deposit) => (
              <div
                key={deposit.id}
                style={{
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '12px',
                  border: '1px solid #fde68a'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: '600', color: '#92400e' }}>
                    ${deposit.amount.toFixed(2)}
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '12px',
                    fontSize: 'clamp(11px, 2.5vw, 12px)',
                    fontWeight: '500'
                  }}>
                    PENDING
                  </span>
                </div>
                <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#6b7280' }}>
                  Submitted: {new Date(deposit.createdAt).toLocaleDateString()}
                </div>
                {deposit.depositAddress && (
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: 'clamp(10px, 2.5vw, 11px)',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    TX: {deposit.depositAddress}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        background: '#e3f2fd',
        borderRadius: '16px',
        border: '1px solid #90caf9',
        width: '100%'
      }}>
        <h3 style={{ 
          marginTop: 0,
          marginBottom: '12px',
          fontSize: 'clamp(16px, 4vw, 18px)',
          fontWeight: '600',
          color: '#1565c0'
        }}>
          Instructions
        </h3>
        <ol style={{ 
          margin: 0,
          paddingLeft: '20px',
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: '#1565c0',
          lineHeight: '1.8'
        }}>
          <li>Copy the wallet address above</li>
          <li>Send your deposit to the address using {NETWORK} network</li>
          <li>Enter the amount and optional transaction hash</li>
          <li>Submit your deposit request</li>
          <li>Wait for admin approval (balance will be added to your wallet)</li>
        </ol>
      </div>
    </div>
  );
}

