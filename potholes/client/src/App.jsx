import React, { useState } from "react";
import WardAssemblyMap from "./WardAssemblyMap.jsx";
import AssemblyBoundaryMap from "./AssemblyBoundaryMap.jsx";
import CombinedBoundaryMap from "./CombinedBoundaryMap.jsx";
import AssemblySelector from "./AssemblySelector.jsx";
import MultiAssemblyMap from "./MultiAssemblyMap.jsx";

export default function App() {
  const [activeMap, setActiveMap] = useState('combined');

  const maps = [
    { id: 'combined', label: 'Combined Boundaries', component: CombinedBoundaryMap },
    { id: 'ward-assembly', label: 'Ward & Assembly', component: WardAssemblyMap },
    { id: 'assembly-boundary', label: 'C.V. RamannNagar', component: AssemblyBoundaryMap },
    { id: 'assembly-selector', label: 'Assembly Selector', component: AssemblySelector },
    { id: 'multi-assembly', label: 'Multi Assembly Map', component: MultiAssemblyMap }
  ];

  const ActiveComponent = maps.find(map => map.id === activeMap)?.component || CombinedBoundaryMap;

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px' 
        }}>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Bengaluru Administrative Boundaries
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '16px',
            opacity: 0.9
          }}>
            Interactive mapping of assembly constituencies and ward boundaries
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px' 
        }}>
          <nav style={{ 
            display: 'flex', 
            gap: '0',
            overflowX: 'auto'
          }}>
            {maps.map(map => (
              <button
                key={map.id}
                onClick={() => setActiveMap(map.id)}
                style={{
                  padding: '15px 20px',
                  border: 'none',
                  backgroundColor: activeMap === map.id ? '#3498db' : 'transparent',
                  color: activeMap === map.id ? 'white' : '#2c3e50',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeMap === map.id ? 'bold' : 'normal',
                  borderBottom: activeMap === map.id ? '3px solid #2980b9' : '3px solid transparent',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }}
                onMouseOver={(e) => {
                  if (activeMap !== map.id) {
                    e.target.style.backgroundColor = '#ecf0f1';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeMap !== map.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {map.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px' 
      }}>
        <ActiveComponent />
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#34495e',
        color: 'white',
        padding: '40px 0',
        marginTop: '40px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>
            About This Application
          </h3>
          <p style={{ 
            margin: '0 0 20px 0', 
            fontSize: '14px',
            lineHeight: '1.6',
            opacity: 0.9,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            This application provides interactive visualization of Bengaluru's administrative boundaries, 
            including assembly constituencies and ward divisions. Built with React and Leaflet for 
            comprehensive geospatial data exploration.
          </p>
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.7,
            borderTop: '1px solid #4a5f7a',
            paddingTop: '20px'
          }}>
            © 2025 Bengaluru Administrative Boundaries | Data: Government Sources | Map: OpenStreetMap
          </div>
        </div>
      </div>
    </div>
  );
}
