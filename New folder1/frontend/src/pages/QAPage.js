import React from 'react';
import { useNavigate } from 'react-router-dom';
import QAChat from '../components/QAChat';

const QAPage = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingTop: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', marginBottom: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            color: '#312e81',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.1)',
            marginBottom: '1rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.1)';
          }}
        >
          ← Back to Homepage
        </button>
      </div>
      <QAChat />
    </div>
  );
};

export default QAPage;
