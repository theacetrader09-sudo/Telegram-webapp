'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileSidebar from '../../components/MobileSidebar';
import DepositModal from '../../components/DepositModal';
import { getPackages, deposit } from '../../services/api';
import { showToast } from '../../components/Toast';

export default function Packages() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
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
    loadPackages();
  }, [router]);

  const loadPackages = async () => {
    try {
      const response = await getPackages();
      if (response.success) {
        setPackages(response.packages || []);
      } else {
        setError(response.error || 'Failed to load packages');
        showToast(response.error || 'Failed to load packages', 'error');
      }
    } catch (err) {
      setError('Failed to load packages');
      showToast('Failed to load packages', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (packageId, amount) => {
    try {
      const response = await deposit(packageId, amount);
      if (response.success) {
        showToast('Deposit created successfully!', 'success');
        setSelectedPackage(null);
        // Reload packages to show updated data
        loadPackages();
      } else {
        showToast(response.error || 'Failed to create deposit', 'error');
        throw new Error(response.error || 'Failed to create deposit');
      }
    } catch (err) {
      showToast(err.message || 'Failed to create deposit', 'error');
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
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading packages...</p>
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
          Investment Packages
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

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginTop: '20px'
        }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                padding: '28px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  margin: 0, 
                  color: 'white',
                  fontSize: '22px',
                  fontWeight: 'bold'
                }}>
                  {pkg.name}
                </h2>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '14px', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Investment Range
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#111827'
                  }}>
                    ${pkg.minAmount.toLocaleString()} - ${pkg.maxAmount.toLocaleString()}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '14px', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Daily ROI
                  </div>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#10b981',
                    marginBottom: '4px'
                  }}>
                    {pkg.dailyROI}%
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280'
                  }}>
                    per day
                  </div>
                </div>

                <div style={{ 
                  padding: '16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  marginTop: '20px',
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.6'
                }}>
                  <strong style={{ color: '#111827' }}>Example:</strong> Invest ${pkg.minAmount.toLocaleString()} 
                  and earn ${(pkg.minAmount * pkg.dailyROI / 100).toFixed(2)} daily
                </div>
              </div>

              <button
                onClick={() => setSelectedPackage(pkg)}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #0088cc 0%, #0066aa 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Invest Now
              </button>
            </div>
          ))}
        </div>

        {packages.length === 0 && !error && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#6b7280',
            background: 'white',
            borderRadius: '16px',
            marginTop: '20px'
          }}>
            <p style={{ fontSize: '18px', margin: 0 }}>No packages available at the moment.</p>
          </div>
        )}

        {selectedPackage && (
          <DepositModal
            package={selectedPackage}
            onClose={() => setSelectedPackage(null)}
            onDeposit={handleDeposit}
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
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
