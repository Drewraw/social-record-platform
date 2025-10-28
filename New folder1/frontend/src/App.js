import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Homepage from './pages/Homepage';
import ProfilePage from './pages/ProfilePage';
import QAPage from './pages/QAPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/qa" element={<QAPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/official/:id" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
