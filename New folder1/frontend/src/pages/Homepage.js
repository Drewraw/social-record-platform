import React, { useState, useEffect } from 'react';
import { Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { officialsAPI } from '../services/api';

const Homepage = () => {
  const navigate = useNavigate();
  const [officials, setOfficials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParty, setFilterParty] = useState('all');
  const [filterLocation, setFilterLocation] = useState(''); // Add location filter
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    try {
      setLoading(true);
      const response = await officialsAPI.getAll();
      
      if (response.data && response.data.length > 0) {
        setOfficials(response.data);
      } else {
        setOfficials([]);
        console.warn('No officials data received from API');
      }
    } catch (error) {
      console.error('Error fetching officials:', error);
      setOfficials([]);
      // Show user-friendly error message
      alert('Unable to load officials data. Please check if the backend server is running on port 5001.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOfficials = officials.filter(official => {
    const matchesSearch = official.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         official.constituency?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         official.party?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParty = filterParty === 'all' || official.party === filterParty;
    const matchesLocation = filterLocation === '' || 
                           official.constituency?.toLowerCase().includes(filterLocation.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory === 'mla') {
      matchesCategory = official.position?.toLowerCase().includes('mla') || official.position?.toLowerCase().includes('mp');
    } else if (selectedCategory === 'dynastic') {
      matchesCategory = official.dynastyStatus && 
                       official.dynastyStatus !== 'Self-Made' && 
                       official.dynastyStatus !== 'No significant political dynasty links';
    } else if (selectedCategory === 'knowledgeable') {
      matchesCategory = official.knowledgeful && official.knowledgeful.toLowerCase().includes('knowledgeable');
    } else if (selectedCategory === 'high-rating') {
      // High rating based on approvals or wealthy status
      matchesCategory = official.currentWealth === 'Wealthy' || official.approvals >= 50;
    } else if (selectedCategory === 'active') {
      matchesCategory = official.discussions > 50 || official.promises > 10;
    }
    
    return matchesSearch && matchesParty && matchesLocation && matchesCategory;
  });

  // Show only 6 cards by default, show all when user is searching
  const isSearching = searchQuery.trim() !== '' || filterParty !== 'all' || filterLocation.trim() !== '' || selectedCategory !== 'all';
  const displayedOfficials = isSearching ? filteredOfficials : filteredOfficials.slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <header style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Elected officials dashboard
          </h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Aggregate verified public data (MyNeta, ECI, Twitter, news, govt sources) to build authoritative profiles of elected officials. The platform is a forum that lets users compare government vs elected officials, track promises, discuss issues, and measure performance over time.
          </p>
        </div>

        {/* Ask AI Button */}
        <button
          onClick={() => navigate('/qa')}
          style={{
            marginTop: '1.5rem',
            width: '100%',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 12px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.3)';
          }}
        >
          <MessageSquare size={24} />
          <span>Ask AI About Politicians</span>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            fontWeight: 700
          }}>
            NEW
          </span>
        </button>

        {/* Category Filter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div 
            className="card"
            onClick={() => setSelectedCategory(selectedCategory === 'mla' ? 'all' : 'mla')}
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              background: selectedCategory === 'mla' ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 'white',
              border: selectedCategory === 'mla' ? '2px solid #3b82f6' : '1px solid #e5e7eb'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏛️</div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e3a8a', marginBottom: '0.25rem' }}>MLAs</h4>
              <p style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>Elected representatives</p>
            </div>
          </div>

          <div 
            className="card"
            onClick={() => setSelectedCategory(selectedCategory === 'dynastic' ? 'all' : 'dynastic')}
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              background: selectedCategory === 'dynastic' ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'white',
              border: selectedCategory === 'dynastic' ? '2px solid #f59e0b' : '1px solid #e5e7eb'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#78350f', marginBottom: '0.25rem' }}>Dynastic</h4>
              <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>Political families</p>
            </div>
          </div>

          <div 
            className="card"
            onClick={() => setSelectedCategory(selectedCategory === 'knowledgeable' ? 'all' : 'knowledgeable')}
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              background: selectedCategory === 'knowledgeable' ? 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' : 'white',
              border: selectedCategory === 'knowledgeable' ? '2px solid #ec4899' : '1px solid #e5e7eb'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#831843', marginBottom: '0.25rem' }}>Knowledgeable</h4>
              <p style={{ fontSize: '0.75rem', color: '#ec4899', marginTop: '0.25rem' }}>Higher education</p>
            </div>
          </div>

          <div 
            className="card"
            onClick={() => setSelectedCategory(selectedCategory === 'high-rating' ? 'all' : 'high-rating')}
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              background: selectedCategory === 'high-rating' ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'white',
              border: selectedCategory === 'high-rating' ? '2px solid #10b981' : '1px solid #e5e7eb'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#064e3b', marginBottom: '0.25rem' }}>High Ratings</h4>
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>Top performers (80+)</p>
            </div>
          </div>

          <div 
            className="card"
            onClick={() => setSelectedCategory(selectedCategory === 'active' ? 'all' : 'active')}
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              background: selectedCategory === 'active' ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' : 'white',
              border: selectedCategory === 'active' ? '2px solid #6366f1' : '1px solid #e5e7eb'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ textAlign: 'center', padding: '0.75rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔥</div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#312e81', marginBottom: '0.25rem' }}>Most Active</h4>
              <p style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.25rem' }}>Recent updates</p>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            All Officials
            {selectedCategory !== 'all' && (
              <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280', marginLeft: '1rem' }}>
                (Filtered by category • 
                <button 
                  onClick={() => setSelectedCategory('all')} 
                  style={{ color: '#3b82f6', marginLeft: '0.5rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Clear filter
                </button>
                )
              </span>
            )}
          </h3>

          {/* Search and Filter Bar - Horizontal */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ flex: '1 1 250px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search officials, party..."
                  className="input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Location Filter */}
              <div style={{ flex: '1 1 200px' }}>
                <input
                  type="text"
                  placeholder="📍 City, Town, District..."
                  className="input"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Party Filter */}
              <div style={{ flex: '0 0 180px' }}>
                <select 
                  className="input"
                  value={filterParty}
                  onChange={(e) => setFilterParty(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="all">All Parties</option>
                  <option value="TDP">TDP</option>
                  <option value="YSRCP">YSRCP</option>
                  <option value="INC">INC (Congress)</option>
                  <option value="Jana Sena Party">Jana Sena</option>
                  <option value="BJP">BJP</option>
                  <option value="JD(S)">JD(S)</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || filterParty !== 'all' || filterLocation) && (
                <button 
                  onClick={() => { setSearchQuery(''); setFilterParty('all'); setFilterLocation(''); }}
                  className="btn btn-outline"
                  style={{ fontSize: '0.875rem' }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Main content area - Full Width */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#6b7280' }}>Loading officials...</p>
            </div>
          ) : displayedOfficials.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#6b7280' }}>No officials found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '1.5rem', minHeight: '400px' }}>
                {displayedOfficials.map((official) => (
                  <div 
                    key={official.id}
                    className="card"
                    onClick={() => navigate(`/profile/${official.id}`, { state: { official } })}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{official.name}</h3>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {official.position}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <img 
                        src={official.image} 
                        alt={official.name} 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          <strong>Party:</strong> {official.party}
                        </p>
                        <p style={{ fontSize: '0.875rem' }}>
                          <strong>Tenure:</strong> {official.tenure}
                        </p>
                      </div>
                    </div>

                    {/* Category Labels/Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {/* MLA/MP Badge */}
                      {official.position?.toLowerCase().includes('mla') && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#dbeafe', color: '#1e40af', borderRadius: '9999px', fontWeight: 500 }}>
                          🏛️ MLA
                        </span>
                      )}
                      {official.position?.toLowerCase().includes('mp') && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#dbeafe', color: '#1e40af', borderRadius: '9999px', fontWeight: 500 }}>
                          🏛️ MP
                        </span>
                      )}
                      
                      {/* Wealthy Badge */}
                      {official.currentWealth === 'Wealthy' && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#d1fae5', color: '#064e3b', borderRadius: '9999px', fontWeight: 500 }}>
                          💰 Wealthy
                        </span>
                      )}
                      {official.currentWealth === 'Moderate' && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#fef3c7', color: '#78350f', borderRadius: '9999px', fontWeight: 500 }}>
                          💵 Moderate
                        </span>
                      )}
                      
                      {/* Dynastic/Self-Made Badge */}
                      {official.dynastyStatus && official.dynastyStatus !== 'Self-Made' && official.dynastyStatus !== 'No significant political dynasty links' && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '9999px', fontWeight: 500 }}>
                          👥 Dynastic
                        </span>
                      )}
                      {(official.dynastyStatus === 'Self-Made' || official.dynastyStatus === 'No significant political dynasty links') && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#e0e7ff', color: '#3730a3', borderRadius: '9999px', fontWeight: 500 }}>
                          ⭐ Self-Made
                        </span>
                      )}
                      
                      {/* Knowledgeable Badge */}
                      {official.knowledgeful && official.knowledgeful.toLowerCase().includes('knowledgeable') && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#fce7f3', color: '#831843', borderRadius: '9999px', fontWeight: 500 }}>
                          🎓 Knowledgeable
                        </span>
                      )}
                      
                      {/* Active Badge - if has recent promises or high activity */}
                      {(official.promises > 10 || official.discussions > 50) && (
                        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#e0e7ff', color: '#312e81', borderRadius: '9999px', fontWeight: 500 }}>
                          🔥 Active
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        <Users size={14} />
                        <span>Community</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }} onClick={(e) => e.stopPropagation()}>
                          Approve
                        </button>
                        <button className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }} onClick={(e) => e.stopPropagation()}>
                          Disapprove
                        </button>
                      </div>
                    </div>
                </div>
              ))}
            </section>
            
            {/* Show message if there are more hidden cards */}
            {!isSearching && filteredOfficials.length > 6 && (
              <div className="card" style={{ marginTop: '1.5rem', textAlign: 'center', padding: '1.5rem', background: '#fef3c7', border: '1px solid #fbbf24' }}>
                <p style={{ color: '#92400e', fontWeight: 600, marginBottom: '0.5rem' }}>
                  📊 Showing 6 of {filteredOfficials.length} politicians
                </p>
                <p style={{ color: '#78350f', fontSize: '0.875rem' }}>
                  Use the search bar above to find specific politicians
                </p>
              </div>
            )}
          </>
          )}
        </main>
      </div>
      
      <footer style={{ marginTop: '4rem', background: '#f3f4f6', textAlign: 'center', padding: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
        © 2025 Social Record Platform — Empowering Open Governance in Bangalore
      </footer>
    </div>
  );
};

export default Homepage;
