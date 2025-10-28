import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import './DonationsPage.css';

const DonationsPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donationsData, setDonationsData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchDonations();
  }, [id]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/donations/politician/${id}`);
      setDonationsData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load donations data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return 'Amount not disclosed';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getSourceBadgeColor = (source) => {
    const colors = {
      'MyNeta': '#4CAF50',
      'Wikipedia': '#2196F3',
      'OpenAI': '#FF9800',
      'Government Records': '#9C27B0',
      'News Article': '#F44336',
      'Other': '#757575'
    };
    return colors[source] || colors.Other;
  };

  const getDonorTypeIcon = (type) => {
    const icons = {
      'Private Company': '🏢',
      'Public Company': '🏛️',
      'Individual': '👤',
      'Unknown': '❓'
    };
    return icons[type] || '❓';
  };

  if (loading) {
    return (
      <div className="donations-page">
        <div className="loading">Loading donations data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="donations-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!donationsData) {
    return (
      <div className="donations-page">
        <div className="no-data">No donations data available</div>
      </div>
    );
  }

  const { politician, summary, donationsByYear, allDonors } = donationsData;

  // Filter donations
  const filteredDonations = donationsByYear.filter(yearData => {
    if (selectedYear !== 'all' && yearData.year !== selectedYear) return false;
    return true;
  });

  return (
    <div className="donations-page">
      {/* Header */}
      <div className="donations-header">
        <h1>Political Donations & Funding</h1>
        <div className="politician-info">
          <h2>{politician.name}</h2>
          <p>{politician.party}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Donations</h3>
            <p className="card-value">{summary.totalDonations}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">₹</div>
          <div className="card-content">
            <h3>Total Amount</h3>
            <p className="card-value">{formatAmount(summary.totalAmount)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <h3>Verified</h3>
            <p className="card-value">{summary.verifiedCount}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3>Years Tracked</h3>
            <p className="card-value">{summary.yearsTracked}</p>
          </div>
        </div>
      </div>

      {/* Sources Breakdown */}
      <div className="sources-section">
        <h3>📚 Data Sources</h3>
        <div className="sources-grid">
          {Object.entries(summary.sources).map(([source, count]) => (
            count > 0 && (
              <div key={source} className="source-badge" style={{ borderColor: getSourceBadgeColor(source) }}>
                <span className="source-name">{source}</span>
                <span className="source-count">{count}</span>
              </div>
            )
          ))}
        </div>
        <p className="sources-note">
          💡 Data collected from MyNeta.info, Wikipedia, OpenAI knowledge base, and government records
        </p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Year:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="all">All Years</option>
            {donationsByYear.map(yearData => (
              <option key={yearData.year} value={yearData.year}>
                {yearData.year}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Type:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Private Company">🏢 Private Company</option>
            <option value="Public Company">🏛️ Public Company</option>
            <option value="Individual">👤 Individual</option>
          </select>
        </div>
      </div>

      {/* Donations by Year */}
      <div className="donations-timeline">
        <h3>💸 Donations Timeline</h3>
        
        {filteredDonations.length === 0 ? (
          <div className="no-results">No donations found for selected filters</div>
        ) : (
          filteredDonations.map(yearData => (
            <div key={yearData.year} className="year-section">
              <div className="year-header">
                <h4>{yearData.year}</h4>
                <span className="year-total">{formatAmount(yearData.total)}</span>
              </div>

              {/* Group by donor type */}
              {Object.entries(yearData.byType).map(([type, donations]) => (
                donations.length > 0 && (selectedType === 'all' || selectedType === type) && (
                  <div key={type} className="donor-type-group">
                    <h5>
                      {getDonorTypeIcon(type)} {type} ({donations.length})
                    </h5>
                    
                    <div className="donations-list">
                      {donations.map(donation => (
                        <div key={donation.id} className="donation-card">
                          <div className="donation-header">
                            <span className="donor-name">{donation.donor_name}</span>
                            <span className="donation-amount">{formatAmount(donation.amount)}</span>
                          </div>
                          
                          <div className="donation-details">
                            <span className="donation-type">{getDonorTypeIcon(donation.donor_type)} {donation.donor_type}</span>
                            
                            {donation.verified && (
                              <span className="verified-badge">✅ Verified</span>
                            )}
                            
                            <span 
                              className="source-badge-small" 
                              style={{ backgroundColor: getSourceBadgeColor(donation.source_type) }}
                            >
                              {donation.source_type}
                            </span>
                          </div>

                          {donation.source_url && (
                            <div className="donation-source">
                              <a href={donation.source_url} target="_blank" rel="noopener noreferrer">
                                🔗 View Source
                              </a>
                            </div>
                          )}

                          {donation.notes && (
                            <div className="donation-notes">
                              <small>{donation.notes}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          ))
        )}
      </div>

      {/* All Donors List */}
      <div className="all-donors-section">
        <h3>📋 Complete Donor List</h3>
        <div className="donors-table">
          <table>
            <thead>
              <tr>
                <th>Donor Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {allDonors.map((donor, index) => (
                <tr key={index}>
                  <td>{donor.name}</td>
                  <td>{getDonorTypeIcon(donor.type)} {donor.type}</td>
                  <td>{formatAmount(donor.amount)}</td>
                  <td>{donor.year || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Note */}
      <div className="donations-footer">
        <p>
          ℹ️ This data is collected from multiple public sources including MyNeta.info, Wikipedia, 
          government records, and news articles. All unverified donations are marked accordingly.
        </p>
        <p className="last-updated">
          Last updated: {new Date(donationsData.lastUpdated).toLocaleDateString('en-IN')}
        </p>
      </div>
    </div>
  );
};

export default DonationsPage;
