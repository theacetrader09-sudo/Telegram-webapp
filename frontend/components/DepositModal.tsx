'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deposit, getUser } from '../services/api';
import { showToast } from './Toast';

interface DepositModalProps {
  package: {
    id: string;
    name: string;
    minAmount: number;
    maxAmount: number;
    dailyROI: number;
  };
  onClose: () => void;
  onDeposit: (packageId: string, amount: number) => Promise<void>;
  onSuccess?: () => void;
}

export default function DepositModal({ package: pkg, onClose, onDeposit, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState<any>(null);
  const [checkingBalance, setCheckingBalance] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkBalance = async () => {
      try {
        const userResponse = await getUser();
        if (userResponse.success) {
          setWallet(userResponse.wallet);
        }
      } catch (err) {
        console.error('Error checking balance:', err);
      } finally {
        setCheckingBalance(false);
      }
    };

    checkBalance();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const depositAmount = parseFloat(amount);

    if (!amount || isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (depositAmount < pkg.minAmount) {
      setError(`Minimum amount is $${pkg.minAmount}`);
      return;
    }

    if (depositAmount > pkg.maxAmount) {
      setError(`Maximum amount is $${pkg.maxAmount}`);
      return;
    }

    // Check balance
    const currentBalance = wallet?.balance || 0;
    if (currentBalance < depositAmount) {
      setError('Insufficient balance');
      showToast('Insufficient balance. Redirecting to deposit page...', 'warning');
      setTimeout(() => {
        onClose();
        router.push('/deposit');
      }, 2000);
      return;
    }

    setLoading(true);
    try {
      await onDeposit(pkg.id, depositAmount);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  if (checkingBalance) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #0088cc',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ margin: 0, color: '#6b7280' }}>Checking balance...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const currentBalance = wallet?.balance || 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '450px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        margin: '20px'
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ 
          marginTop: 0, 
          marginBottom: '20px',
          fontSize: 'clamp(20px, 5vw, 24px)',
          fontWeight: 'bold',
          color: '#111827'
        }}>
          Activate {pkg.name}
        </h2>
        
        {/* Balance Display */}
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: currentBalance >= pkg.minAmount ? '#f0fdf4' : '#fef3c7',
          borderRadius: '8px',
          border: `1px solid ${currentBalance >= pkg.minAmount ? '#bbf7d0' : '#fde68a'}`
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Available Balance
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            color: currentBalance >= pkg.minAmount ? '#166534' : '#92400e'
          }}>
            ${currentBalance.toFixed(2)}
          </div>
          {currentBalance < pkg.minAmount && (
            <p style={{ 
              margin: '8px 0 0 0', 
              fontSize: '12px', 
              color: '#92400e'
            }}>
              Minimum required: ${pkg.minAmount}
            </p>
          )}
        </div>
        
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ margin: '4px 0', fontSize: 'clamp(12px, 3vw, 14px)' }}>
            <strong>Daily ROI:</strong> {pkg.dailyROI}%
          </p>
          <p style={{ margin: '4px 0', fontSize: 'clamp(12px, 3vw, 14px)' }}>
            <strong>Range:</strong> ${pkg.minAmount} - ${pkg.maxAmount.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              fontSize: 'clamp(13px, 3.5vw, 14px)'
            }}>
              Investment Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={pkg.minAmount}
              max={pkg.maxAmount}
              step="0.01"
              placeholder={`Enter amount (${pkg.minAmount} - ${pkg.maxAmount})`}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: 'clamp(12px, 3vw, 14px)'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: 'clamp(13px, 3.5vw, 16px)',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || currentBalance < pkg.minAmount}
              style={{
                flex: 1,
                padding: '12px',
                background: loading || currentBalance < pkg.minAmount
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || currentBalance < pkg.minAmount ? 'not-allowed' : 'pointer',
                fontSize: 'clamp(13px, 3.5vw, 16px)',
                fontWeight: '600',
                boxShadow: loading || currentBalance < pkg.minAmount ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s',
                opacity: loading || currentBalance < pkg.minAmount ? 0.7 : 1
              }}
              onMouseDown={(e) => !loading && currentBalance >= pkg.minAmount && (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? 'Activating...' : currentBalance < pkg.minAmount ? 'Insufficient Balance' : 'Activate Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
