'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ROITransactionModal from '../../components/ROITransactionModal';
import { getROI } from '../../services/api';
import { showToast } from '../../components/Toast';

export default function ROI() {
  const router = useRouter();
  const [roiData, setRoiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showROIModal, setShowROIModal] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        router.push('/');
        return;
      }
    };

    checkAuth();
    loadROI();
  }, [router]);

  const loadROI = async () => {
    try {
      const response = await getROI();
      if (response.success) {
        setRoiData(response);
      } else {
        setError(response.error || 'Failed to load ROI data');
        showToast(response.error || 'Failed to load ROI data', 'error');
      }
    } catch (err) {
      setError('Failed to load ROI data');
      showToast('Failed to load ROI data', 'error');
      console.error(err);
    } finally {
      setLoading(false);
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
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading ROI data...</p>
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

  const totalROI = roiData?.totalROI || 0;
  const totalReferrals = roiData?.totalReferrals || 0;
  const records = roiData?.roiRecords || [];

  // Calculate today's and this month's ROI
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayROI = records
    .filter(r => new Date(r.createdAt) >= today && r.type === 'SELF')
    .reduce((sum, r) => sum + r.amount, 0);

  const thisMonthROI = records
    .filter(r => new Date(r.createdAt) >= thisMonth && r.type === 'SELF')
    .reduce((sum, r) => sum + r.amount, 0);

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
        ROI Earnings
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

      {/* ROI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
        gap: '12px',
        marginBottom: '20px',
        width: '100%'
      }}>
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

        <div style={{
          padding: '16px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          width: '100%'
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
            Today's ROI
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#1e40af', wordBreak: 'break-word' }}>
            ${todayROI.toFixed(2)}
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
            This Month
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#92400e', wordBreak: 'break-word' }}>
            ${thisMonthROI.toFixed(2)}
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
            Referral Income
          </div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 'bold', color: '#9f1239', wordBreak: 'break-word' }}>
            ${totalReferrals.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ROI Records */}
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        width: '100%'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ 
            margin: 0,
            fontSize: 'clamp(18px, 4vw, 20px)',
            fontWeight: '600',
            color: '#111827'
          }}>
            ROI History
          </h2>
        </div>
        
        {records.length > 0 ? (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 12px', fontSize: 'clamp(11px, 3vw, 14px)', color: '#6b7280' }}>
                      {new Date(record.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#10b981', fontSize: 'clamp(13px, 3.5vw, 16px)' }}>
                      ${record.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '500',
                        backgroundColor: record.type === 'SELF' ? '#dbeafe' : '#fef3c7',
                        color: record.type === 'SELF' ? '#1e40af' : '#92400e',
                        whiteSpace: 'nowrap'
                      }}>
                        {record.type === 'SELF' ? 'Own ROI' : record.type.replace('REFERRAL_LEVEL_', 'L')}
                      </span>
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
            <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', margin: 0 }}>No ROI records yet. Start investing to earn daily ROI!</p>
          </div>
        )}
      </div>

      {/* ROI Transaction Modal */}
      <ROITransactionModal
        isOpen={showROIModal}
        onClose={() => setShowROIModal(false)}
        title="Total ROI Transaction History"
        transactions={records}
        type="SELF"
      />
    </div>
  );
}
