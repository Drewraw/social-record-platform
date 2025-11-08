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
    if (typeof field === 'number') return field.toString();
    if (field.value !== undefined) return field.value;
    if (typeof field === 'object' && field !== null) {
      // Handle cases where the object might have other properties
      return JSON.stringify(field);
    }
    return null;
  };

  // Helper function to get field with source URL from completeData
  const getFieldWithSource = (fieldName, fallbackValue = 'N/A') => {
    const completeData = profile.completeData || {};
    const fieldData = completeData[fieldName];
    
    if (fieldData && fieldData.value && fieldData.sourceUrl) {
      return {
        value: fieldData.value,
        sourceUrl: fieldData.sourceUrl
      };
    }
    
    // Fallback to official field directly if completeData not available
    const directValue = official[fieldName] || fallbackValue;
    return {
      value: directValue,
      sourceUrl: 'Database'
    };
  };

  // Use structured summary fields if available, fallback to raw scraped data
  const completeData = profile.completeData || {};
  const analysis = profile.analysis || {};
  const wikipedia = profile.wikipedia || {};
  const myneta = profile.myneta || {};

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
                    {(() => {
                      const positionData = getFieldWithSource('position', official.position);
                      return renderTableRow('Position', positionData.value, positionData.sourceUrl);
                    })()}
                    {(() => {
                      const partyData = getFieldWithSource('party', official.party);
                      return renderTableRow('Party & Role', partyData.value, partyData.sourceUrl);
                    })()}
                    {(() => {
                      const constituencyData = getFieldWithSource('constituency', official.constituency);
                      return renderTableRow('Constituency', constituencyData.value, constituencyData.sourceUrl);
                    })()}
                    
                    {/* Educational Status */}
                    {renderSectionHeader('🎓 Educational Status')}
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151', verticalAlign: 'top' }}>Educational Qualification</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280', verticalAlign: 'top' }}>
                        {(() => {
                          const educationData = getFieldWithSource('education', official.education);
                          if (educationData.value && educationData.value !== 'N/A' && educationData.value !== '') {
                            return (
                              <div style={{ 
                                padding: '0.75rem', 
                                background: '#dbeafe', 
                                borderRadius: '0.5rem',
                                border: '1px solid #93c5fd',
                                color: '#1e40af',
                                fontWeight: 500
                              }}>
                                🎓 {educationData.value}
                              </div>
                            );
                          } else {
                            return (
                              <div style={{ 
                                padding: '0.5rem', 
                                background: '#fef3c7', 
                                borderRadius: '0.375rem',
                                border: '1px solid #fcd34d',
                                color: '#92400e',
                                fontSize: '0.875rem',
                                fontWeight: 500
                              }}>
                                📋 Educational qualification not declared in affidavit
                              </div>
                            );
                          }
                        })()}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#3b82f6', verticalAlign: 'top' }}>
                        {(() => {
                          const educationData = getFieldWithSource('education', official.education);
                          if (educationData.sourceUrl && educationData.sourceUrl !== 'N/A' && educationData.sourceUrl !== 'Database') {
                            return (
                              <a href={educationData.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>
                                {educationData.sourceUrl.length > 50 ? educationData.sourceUrl.substring(0, 47) + '...' : educationData.sourceUrl}
                              </a>
                            );
                          } else {
                            return <span style={{ color: '#9ca3af' }}>MyNeta Analysis</span>;
                          }
                        })()}
                      </td>
                    </tr>
                    {(() => {
                      const ageData = getFieldWithSource('age', official.age);
                      if (ageData.value && ageData.value !== 'N/A') {
                        return renderTableRow('Age', `${ageData.value} years`, ageData.sourceUrl);
                      }
                      return null;
                    })()}
                    
                    {/* Assets & Financials */}
                    {renderSectionHeader('Assets & Financials (2024 Affidavit)')}
                    {(() => {
                      const assetsData = getFieldWithSource('assets', official.assets);
                      return renderTableRow('Total Assets', assetsData.value, assetsData.sourceUrl);
                    })()}
                    {(() => {
                      const familyWealthData = getFieldWithSource('familyWealth', official.family_wealth);
                      return renderTableRow('Source of Wealth', familyWealthData.value, familyWealthData.sourceUrl);
                    })()}
                    {(() => {
                      const liabilitiesData = getFieldWithSource('liabilities', official.liabilities);
                      return renderTableRow('Liabilities', liabilitiesData.value, liabilitiesData.sourceUrl);
                    })()}
                    
                    {/* Criminal Cases */}
                    {renderSectionHeader('Criminal Cases')}
                    {(() => {
                      const criminalCasesData = getFieldWithSource('criminalCases', official.criminal_cases);
                      return renderTableRow('Criminal Cases Declared', criminalCasesData.value, criminalCasesData.sourceUrl);
                    })()}
                    
                    {/* Convicted Cases - Enhanced field with conviction status */}
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151', verticalAlign: 'top' }}>Conviction Status</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280', verticalAlign: 'top' }}>
                        {official.convicted_cases ? (
                          <div style={{ 
                            padding: '0.5rem', 
                            borderRadius: '0.375rem',
                            background: official.convicted_cases > 0 ? '#fee2e2' : '#d1fae5',
                            border: official.convicted_cases > 0 ? '1px solid #fca5a5' : '1px solid #86efac',
                            color: official.convicted_cases > 0 ? '#dc2626' : '#059669',
                            fontWeight: 600
                          }}>
                            {official.convicted_cases > 0 ? (
                              <span>🚨 {official.convicted_cases} Convicted Case{official.convicted_cases > 1 ? 's' : ''}</span>
                            ) : (
                              <span>✅ Zero Convictions</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Conviction status not available</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#3b82f6', verticalAlign: 'top' }}>
                        {(() => {
                          const convictedCasesData = getFieldWithSource('convictedCases', official.convicted_cases);
                          if (convictedCasesData.sourceUrl && convictedCasesData.sourceUrl !== 'N/A' && convictedCasesData.sourceUrl !== 'Database') {
                            return (
                              <a href={convictedCasesData.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>
                                {convictedCasesData.sourceUrl.length > 50 ? convictedCasesData.sourceUrl.substring(0, 47) + '...' : convictedCasesData.sourceUrl}
                              </a>
                            );
                          } else {
                            return <span style={{ color: '#9ca3af' }}>MyNeta Enhanced Data</span>;
                          }
                        })()}
                      </td>
                    </tr>
                    
                    {/* Political Background */}
                    {renderSectionHeader('Political Background')}
                    {(() => {
                      const dynastyStatusData = getFieldWithSource('dynastyStatus', official.dynastyStatus);
                      return renderTableRow('Dynasty Status', dynastyStatusData.value, dynastyStatusData.sourceUrl);
                    })()}
                    {(() => {
                      const tenureData = getFieldWithSource('tenure', official.tenure);
                      return renderTableRow('Tenure', tenureData.value, tenureData.sourceUrl);
                    })()}
                    {official.consistent_winner !== null && renderTableRow('Consistent Winner', official.consistent_winner ? 'Yes' : 'No', 'Database')}
                    {renderTableRow('Career Highlight', official.family_wealth || 'N/A', 'MyNeta Database')}
                    
                    {/* Political Relations */}
                    {renderSectionHeader('👨‍👩‍👧‍👦 Political Relations & Family in Politics')}
                    {official.politicalRelatives && official.politicalRelatives !== 'None identified' && official.politicalRelatives !== 'Error fetching data' ? (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151', verticalAlign: 'top' }}>Family Members in Politics</td>
                        <td colSpan={2} style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {(() => {
                            // Special handling for T.G. Bharath - show father's info correctly
                            if (official.name === 'T.G. Bharath' && official.politicalRelatives.includes('T. G. Bharath - Child')) {
                              return (
                                <div style={{ 
                                  padding: '0.75rem', 
                                  marginBottom: '0.5rem', 
                                  background: '#fef3c7', 
                                  borderRadius: '0.5rem',
                                  border: '1px solid #fcd34d',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.5rem'
                                }}>
                                  <span style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>👨</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.25rem', fontSize: '0.95rem' }}>T.G. Venkatesh</div>
                                    <div style={{ fontSize: '0.8rem', color: '#78350f', marginBottom: '0.25rem' }}>
                                      <span style={{ background: '#fbbf24', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', marginRight: '0.5rem', fontWeight: 600 }}>Father</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '0.25rem' }}>
                                      <strong>Position:</strong> Politician & Businessman
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#78350f', fontWeight: 600 }}>
                                      <strong>Party:</strong> Bharatiya Janata Party (2019-present)
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                      📖 Source: Wikipedia Research - <a href="https://en.wikipedia.org/wiki/T._G._Venkatesh" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>T.G. Venkatesh</a>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            
                            // Default handling for other politicians
                            return official.politicalRelatives.split(', ').map((relative, idx) => {
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
                            });
                          })()}
                        </td>
                      </tr>
                    ) : (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Family Members in Politics</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                          ✅ None identified - Self-made politician
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#3b82f6', verticalAlign: 'top' }}>
                          {(() => {
                            const politicalRelativesData = getFieldWithSource('politicalRelatives', official.politicalRelatives);
                            if (politicalRelativesData.sourceUrl && politicalRelativesData.sourceUrl !== 'N/A' && politicalRelativesData.sourceUrl !== 'Database') {
                              return (
                                <a href={politicalRelativesData.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>
                                  {politicalRelativesData.sourceUrl.length > 50 ? politicalRelativesData.sourceUrl.substring(0, 47) + '...' : politicalRelativesData.sourceUrl}
                                </a>
                              );
                            } else {
                              return <span style={{ color: '#9ca3af' }}>MyNeta Analysis</span>;
                            }
                          })()}
                        </td>
                      </tr>
                    )}
                    
                    {/* Business Interests */}
                    {renderSectionHeader('Business Interests & Affiliated Companies')}
                    
                    {/* Business Interests - Enhanced field from database */}
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151', verticalAlign: 'top' }}>Business Interests & Companies</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280', verticalAlign: 'top' }}>
                        {official.family_wealth ? (
                          <div style={{ 
                            padding: '0.75rem', 
                            background: '#fef3c7', 
                            borderRadius: '0.5rem',
                            border: '1px solid #fcd34d',
                            color: '#92400e',
                            fontWeight: 500
                          }}>
                            🏢 {official.family_wealth}
                          </div>
                        ) : (
                          <div style={{ 
                            padding: '0.5rem', 
                            background: '#d1fae5', 
                            borderRadius: '0.375rem',
                            border: '1px solid #86efac',
                            color: '#059669',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}>
                            ✅ No significant business interests identified
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#3b82f6', verticalAlign: 'top' }}>
                        {(() => {
                          const familyWealthData = getFieldWithSource('familyWealth', official.family_wealth);
                          if (familyWealthData.sourceUrl && familyWealthData.sourceUrl !== 'N/A' && familyWealthData.sourceUrl !== 'Database') {
                            return (
                              <a href={familyWealthData.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>
                                {familyWealthData.sourceUrl.length > 50 ? familyWealthData.sourceUrl.substring(0, 47) + '...' : familyWealthData.sourceUrl}
                              </a>
                            );
                          } else {
                            return <span style={{ color: '#9ca3af' }}>MyNeta Analysis</span>;
                          }
                        })()}
                      </td>
                    </tr>
                    
                    {/* Fallback to profession field if family_wealth not available */}
                    {!official.family_wealth && (
                      renderTableRow('Professional Background', 'Information not available', 'MyNeta Database')
                    )}
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
                      'Information not available',
                      'Database'
                    )}
                    {renderTableRow(
                      'Current Activity',
                      'Information not available',
                      'Database'
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
