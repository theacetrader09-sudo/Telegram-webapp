'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import MobileSidebar from '../../components/MobileSidebar';
import { getROI } from '../../services/api';
import { showToast } from '../../components/Toast';

export default function ROI() {
  const router = useRouter();
  const [roiData, setRoiData] = useState(null);
  const [loading, setLoading] = useState(true);
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
          ROI Earnings
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

        {/* ROI Summary Cards */}
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
              Total ROI
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
              ${totalROI.toFixed(2)}
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
              Today's ROI
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
              ${todayROI.toFixed(2)}
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
              This Month
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
              ${thisMonthROI.toFixed(2)}
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
              Referral Income
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9f1239' }}>
              ${totalReferrals.toFixed(2)}
            </div>
          </div>
        </div>

        {/* ROI Records */}
        <div style={{ 
          marginTop: '24px',
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
              ROI History
            </h2>
          </div>
          
          {records.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={record.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {new Date(record.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#10b981', fontSize: '16px' }}>
                        ${record.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: record.type === 'SELF' ? '#dbeafe' : '#fef3c7',
                          color: record.type === 'SELF' ? '#1e40af' : '#92400e'
                        }}>
                          {record.type === 'SELF' ? 'Own ROI' : record.type.replace('REFERRAL_LEVEL_', 'Level ')}
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
              <p style={{ fontSize: '16px', margin: 0 }}>No ROI records yet. Start investing to earn daily ROI!</p>
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
          table {
            font-size: 12px;
          }
          th, td {
            padding: 8px 12px !important;
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
