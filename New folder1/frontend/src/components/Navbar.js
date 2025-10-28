import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isProfilePage = location.pathname.includes('/profile/') || location.pathname.includes('/official/');

  return (
    <nav>
      <div className="nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* App Logo/Title (Home) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h1>Social Record Platform</h1>
          </Link>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            — Open civic forum for tracking promises
          </span>
        </div>

        {/* Navigation Links or Back Button */}
        {isProfilePage ? (
          <button 
            className="btn btn-outline"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
        ) : (
          <ul className="nav-links" style={{ margin: 0 }}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/qa">Ask AI 🤖</Link></li>
            <li><Link to="/">Officials</Link></li>
            <li><Link to="/">Insights</Link></li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
