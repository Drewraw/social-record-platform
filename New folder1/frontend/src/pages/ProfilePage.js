import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, ExternalLink, Twitter } from 'lucide-react';
import axios from 'axios';

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [official, setOfficial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOfficialProfile();
  }, [id]);

  const fetchOfficialProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/officials/${id}`);
      setOfficial(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching official:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Loading Profile...</div>
          <p style={{ color: '#6b7280' }}>Fetching comprehensive data from verified sources</p>
        </div>
      </div>
    );
  }

  if (error || !official) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>Error</div>
          <p style={{ color: '#6b7280' }}>{error || 'Official not found'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary" 
            style={{ marginTop: '1rem' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const profile = official.profileOverview || {};


  // Helper function to safely extract value from profile data
  const getValue = (field) => {
    if (!field) return null;
    if (typeof field === 'string') return field;
    if (field.value) return field.value;
    return null;
  };

  // Use structured summary fields if available, fallback to raw scraped data
  const completeData = profile.completeData || {};
  const analysis = profile.analysis || {};
  const wikipedia = profile.wikipedia || {};
  const myneta = profile.myneta || {};


  // Helper to get value and source from myneta if structured missing
  const getField = (structured, rawKey) => {
    return structured || getValue(myneta[rawKey]);
  };
  // Helper to get source URL from structured or myneta
  const getSource = (structured, rawKey) => {
    if (structured && structured.sourceUrl) return structured.sourceUrl;
    if (myneta[rawKey] && myneta[rawKey].sourceUrl) return myneta[rawKey].sourceUrl;
    return null;
  };

  // Helper function to render table row
  const renderTableRow = (category, detail, sourceUrl, isHeader = false) => {
    if (isHeader) {
      return (
        <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{category}</th>
          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{detail}</th>
          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{sourceUrl}</th>
        </tr>
      );
    }
    
    if (!detail || detail === 'N/A') return null;
    
    return (
      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
        <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151', verticalAlign: 'top' }}>{category}</td>
        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280', verticalAlign: 'top' }}>{detail}</td>
        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#3b82f6', verticalAlign: 'top' }}>
          {sourceUrl && sourceUrl !== 'N/A' ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>
              {sourceUrl.length > 50 ? sourceUrl.substring(0, 47) + '...' : sourceUrl}
            </a>
          ) : (
            <span style={{ color: '#9ca3af' }}>-</span>
          )}
        </td>
      </tr>
    );
  };

  const renderSectionHeader = (title) => {
    return (
      <tr style={{ background: '#fef3c7' }}>
        <td colSpan={3} style={{ padding: '0.75rem', fontWeight: 700, fontSize: '0.95rem', color: '#92400e' }}>{title}</td>
      </tr>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <img src={official.image} alt={official.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>{official.name}</h1>
              <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '0.5rem' }}>{official.position}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <span><strong>Party:</strong> {official.party}</span>
                <span><strong>Constituency:</strong> {official.constituency}</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e5e7eb', background: 'white', borderRadius: '0.75rem 0.75rem 0 0', padding: '0 1rem', marginBottom: '0' }}>
          {[
            { id: 'profile', label: ' Profile' },
            { id: 'promises', label: ' Promises' },
            { id: 'activity', label: ' Activity' },
            { id: 'compare', label: ' Compare' },
            { id: 'forum', label: ' Forum' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.95rem', color: activeTab === tab.id ? '#3b82f6' : '#6b7280', borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent', marginBottom: '-2px', transition: 'all 0.2s' }}>{tab.label}</button>
          ))}
        </div>
        <div className="card" style={{ borderRadius: '0 0 0.75rem 0.75rem', marginTop: '0' }}>
          {activeTab === 'profile' && profile && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem' }}>Complete Profile</h2>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                  <thead>
                    {renderTableRow('Category', 'Detail / Score', 'Source URL', true)}
                  </thead>
                  <tbody>
                    {/* Current Office & Party */}
                    {/* Party History - FIRST FIELD */}
                    {renderSectionHeader('🏛️ Party History & Switches')}
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151', verticalAlign: 'top' }}>Party Switches (Last 10 Years)</td>
                      <td colSpan={2} style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        <div style={{ 
                          padding: '0.75rem', 
                          background: official.partyHistory?.includes('No party switches') ? '#d1fae5' : '#fef3c7',
                          borderRadius: '0.5rem',
                          border: official.partyHistory?.includes('No party switches') ? '1px solid #10b981' : '1px solid #fbbf24',
                          color: official.partyHistory?.includes('No party switches') ? '#065f46' : '#92400e',
                          fontWeight: 600
                        }}>
                          {official.partyHistory || 'No party switches in last 10 years'}
                        </div>
                      </td>
                    </tr>

                    {renderSectionHeader('Current Office & Party')}
                    {renderTableRow('Position', getField(completeData.profession, 'Self'), getSource(completeData.profession, 'Self'))}
                    {renderTableRow('Party & Role', getField(completeData.party, 'Party'), getSource(completeData.party, 'Party'))}
                    {renderTableRow('Constituency', getField(completeData.constituency, 'Constituency'), getSource(completeData.constituency, 'Constituency'))}
                    
                    {/* Educational Status */}
                    {renderSectionHeader('Educational Status')}
                    {renderTableRow('Education', getField(completeData.education, 'Education'), getSource(completeData.education, 'Education'))}
                    
                    {/* Assets & Financials */}
                    {renderSectionHeader('Assets & Financials (2024 Affidavit)')}
                    {renderTableRow('Total Assets', getField(completeData.assets, 'Lok Sabha 2019'), getSource(completeData.assets, 'Lok Sabha 2019'))}
                    {renderTableRow('Source of Wealth', getField(analysis.currentWealth, 'Source of Wealth'), getSource(analysis.currentWealth, 'Source of Wealth'))}
                    {renderTableRow('Liabilities', getField(completeData.liabilities, 'Liabilities'), getSource(completeData.liabilities, 'Liabilities'))}
                    
                    {/* Criminal Cases */}
                    {renderSectionHeader('Criminal Cases')}
                    {renderTableRow('Criminal Cases Declared', getField(completeData.criminalCases, 'Criminal Cases'), getSource(completeData.criminalCases, 'Criminal Cases'))}
                    
                    {/* Political Background */}
                    {renderSectionHeader('Political Background')}
                    {renderTableRow('Dynasty Status', getField(completeData.dynastyStatus, 'Dynasty Status'), getSource(completeData.dynastyStatus, 'Dynasty Status'))}
                    {renderTableRow('Career Highlight', analysis.familyWealth, null)}
                    
                    {/* Political Relations */}
                    {renderSectionHeader('👨‍👩‍👧‍👦 Political Relations & Family in Politics')}
                    {official.politicalRelatives && official.politicalRelatives !== 'None identified' && official.politicalRelatives !== 'Error fetching data' ? (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151', verticalAlign: 'top' }}>Family Members in Politics</td>
                        <td colSpan={2} style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {official.politicalRelatives.split(', ').map((relative, idx) => {
                            // Parse: Name - Personal Relation - Political Position - Party (Year)
                            const parts = relative.trim().split(' - ');
                            if (parts.length >= 3) {
                              const name = parts[0];
                              const relation = parts[1];
                              const position = parts[2];
                              const party = parts[3] || '';
                              return (
                                <div key={idx} style={{ 
                                  padding: '0.75rem', 
                                  marginBottom: '0.5rem', 
                                  background: '#fef3c7', 
                                  borderRadius: '0.5rem',
                                  border: '1px solid #fcd34d',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.5rem'
                                }}>
                                  <span style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>👤</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '0.25rem' }}>
                                      <span style={{ background: '#fbbf24', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', marginRight: '0.5rem', fontWeight: 600 }}>{relation}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.25rem' }}>
                                      <strong>Position:</strong> {position}
                                    </div>
                                    {party && (
                                      <div style={{ fontSize: '0.8rem', color: '#78350f', fontWeight: 600 }}>
                                        <strong>Party:</strong> {party}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div key={idx} style={{ 
                                padding: '0.5rem', 
                                marginBottom: '0.5rem', 
                                background: '#fef3c7', 
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                color: '#92400e'
                              }}>
                                {relative}
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    ) : (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Family Members in Politics</td>
                        <td colSpan={2} style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                          ✅ None identified - Self-made politician
                        </td>
                      </tr>
                    )}
                    
                    {/* Business Interests */}
                    {renderSectionHeader('Business Interests & Affiliated Companies')}
                    {renderTableRow('Primary Company', getField(completeData.profession, 'Self Business and Social Worker Spouse Business'), getSource(completeData.profession, 'Self Business and Social Worker Spouse Business'))}
                  </tbody>
                </table>
              </div>

              {/* Performance Stats */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e40af' }}>📊 Performance Stats</h3>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div><span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{official.completed || 0}</span> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Completed</span></div>
                  <div><span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{official.inProgress || 0}</span> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>In Progress</span></div>
                  <div><span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{official.broken || 0}</span> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Broken</span></div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'promises' && profile && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem' }}>Promises & Current Focus</h2>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                  <thead>
                    {renderTableRow('Category', 'Detail / Score', 'Source URL', true)}
                  </thead>
                  <tbody>
                    {renderSectionHeader('Promises & Credibility (2024 Focus)')}
                    {renderTableRow(
                      'Key Promises',
                      getField(completeData.keyPromises, 'Key Promises'),
                      myneta['Key Promises']?.sourceUrl || analysis.keyPromisesSourceUrl || null
                    )}
                    {renderTableRow(
                      'Current Activity',
                      getField(completeData.currentFocus, 'Current Activity'),
                      myneta['Current Activity']?.sourceUrl || analysis.currentFocusSourceUrl || null
                    )}
                  </tbody>
                </table>
              </div>

              {/* Performance Stats in Promises Tab */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fefce8', borderRadius: '0.5rem', border: '1px solid #fde047' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#854d0e' }}>📊 Promise Tracking</h3>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div><span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{official.completed || 0}</span> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Completed</span></div>
                  <div><span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{official.inProgress || 0}</span> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>In Progress</span></div>
                  <div><span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{official.broken || 0}</span> <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Broken</span></div>
                </div>
              </div>
            </div>
          )}
          {activeTab !== 'profile' && activeTab !== 'promises' && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}><h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', textTransform: 'capitalize' }}>{activeTab} Tab</h3><p style={{ color: '#9ca3af', fontSize: '1rem' }}>Feature coming soon...</p></div>
          )}
        </div>
        <div className="card" style={{ marginTop: '1.5rem' }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ display: 'flex', gap: '0.75rem' }}><button className="btn btn-outline" style={{ fontSize: '0.875rem' }}><ExternalLink size={16} style={{ marginRight: '0.5rem' }} />MyNeta</button><button className="btn btn-outline" style={{ fontSize: '0.875rem' }}><Twitter size={16} style={{ marginRight: '0.5rem' }} />Twitter</button></div><div style={{ display: 'flex', gap: '0.75rem' }}><button className="btn" style={{ fontSize: '0.875rem', background: 'transparent', color: '#10b981', border: '2px solid #10b981' }}><ThumbsUp size={16} style={{ marginRight: '0.5rem' }} />Approve ({official.approvals || 0})</button><button className="btn" style={{ fontSize: '0.875rem', background: '#ef4444', color: 'white', border: '2px solid #ef4444' }}><ThumbsDown size={16} style={{ marginRight: '0.5rem' }} />Disapprove ({official.disapprovals || 0})</button></div></div></div>
      </div>
    </div>
  );
};

export default ProfilePage;
