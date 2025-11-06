import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const AssemblyBoundaryMap = () => {
  const [boundaryData, setBoundaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize map
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([12.9716, 77.5946], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Load C.V. RamannNagar boundary data
    const loadBoundaryData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/C.V._RamannNagar_boundary.geojson');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBoundaryData(data);

        if (mapInstanceRef.current && data) {
          // Add boundary to map
          const boundaryLayer = L.geoJSON(data, {
            style: {
              color: '#e74c3c',
              weight: 3,
              fillColor: '#e74c3c',
              fillOpacity: 0.2,
              dashArray: '10, 10'
            },
            onEachFeature: (feature, layer) => {
              if (feature.properties) {
                const assemblyName = feature.properties.assembly || 'C.V. RamannNagar';
                layer.bindPopup(`
                  <div style="font-family: Arial, sans-serif;">
                    <h3 style="margin: 0 0 10px 0; color: #e74c3c;">${assemblyName}</h3>
                    <p style="margin: 5px 0;"><strong>Type:</strong> Assembly Constituency</p>
                    <p style="margin: 5px 0;"><strong>State:</strong> Karnataka</p>
                    <p style="margin: 5px 0;"><strong>City:</strong> Bengaluru</p>
                  </div>
                `);
              }
            }
          }).addTo(mapInstanceRef.current);

          // Fit map to boundary
          const bounds = boundaryLayer.getBounds();
          mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (err) {
        console.error('Error loading boundary data:', err);
        setError('Failed to load assembly boundary data. Please make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };

    loadBoundaryData();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          margin: '0 0 15px 0', 
          color: '#2c3e50',
          fontSize: '24px'
        }}>
          C.V. RamannNagar Assembly Constituency
        </h2>
        
        {loading && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            Loading assembly boundary data...
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e74c3c', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            {error}
          </div>
        )}

        {boundaryData && !loading && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#2ecc71', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <strong>✓ Assembly boundary loaded successfully</strong>
          </div>
        )}

        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ecf0f1', 
          borderRadius: '4px',
          fontSize: '14px',
          color: '#7f8c8d'
        }}>
          <strong>About:</strong> This map displays the administrative boundary of the C.V. RamannNagar 
          assembly constituency in Bengaluru. The red dashed line represents the official constituency boundary.
        </div>
      </div>

      <div style={{ 
        height: '600px', 
        border: '2px solid #bdc3c7', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#ecf0f1', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#7f8c8d'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Map Features:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Click on the boundary line to see constituency information</li>
          <li>Use mouse wheel to zoom in/out</li>
          <li>Drag to pan around the map</li>
          <li>The map automatically fits to show the entire constituency</li>
        </ul>
      </div>
    </div>
  );
};

export default AssemblyBoundaryMap;