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

const CombinedBoundaryMap = () => {
  const [wardData, setWardData] = useState(null);
  const [assemblyData, setAssemblyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWards, setShowWards] = useState(true);
  const [showAssembly, setShowAssembly] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const wardLayerRef = useRef(null);
  const assemblyLayerRef = useRef(null);
  const layerControlRef = useRef(null);

  useEffect(() => {
    // Initialize map
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([12.9716, 77.5946], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Initialize layer control
      layerControlRef.current = L.control.layers(null, null, {
        position: 'topright',
        collapsed: false
      }).addTo(mapInstanceRef.current);
    }

    // Load boundary data
    const loadBoundaryData = async () => {
      try {
        setLoading(true);

        // Load ward data
        const wardResponse = await fetch('http://localhost:5000/wards_with_assembly_WGS84.geojson');
        if (wardResponse.ok) {
          const wardData = await wardResponse.json();
          setWardData(wardData);
        }

        // Load assembly boundary
        const assemblyResponse = await fetch('http://localhost:5000/C.V._RamannNagar_boundary.geojson');
        if (assemblyResponse.ok) {
          const assemblyData = await assemblyResponse.json();
          setAssemblyData(assemblyData);
        }

      } catch (err) {
        console.error('Error loading boundary data:', err);
        setError('Failed to load boundary data. Please make sure the server is running.');
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

  // Update layers when data or toggles change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing layers
    if (wardLayerRef.current) {
      mapInstanceRef.current.removeLayer(wardLayerRef.current);
      layerControlRef.current.removeLayer(wardLayerRef.current);
    }
    if (assemblyLayerRef.current) {
      mapInstanceRef.current.removeLayer(assemblyLayerRef.current);
      layerControlRef.current.removeLayer(assemblyLayerRef.current);
    }

    // Add ward layer
    if (wardData && showWards) {
      wardLayerRef.current = L.geoJSON(wardData, {
        style: {
          color: '#3498db',
          weight: 2,
          fillColor: '#3498db',
          fillOpacity: 0.1
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            layer.bindPopup(`
              <div style="font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #3498db;">${props.ward_name || 'Ward'}</h3>
                <p style="margin: 5px 0;"><strong>Ward No:</strong> ${props.ward_no || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Assembly:</strong> ${props.assembly || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Zone:</strong> ${props.city_zone || 'N/A'}</p>
              </div>
            `);
          }
        }
      });
      
      wardLayerRef.current.addTo(mapInstanceRef.current);
      layerControlRef.current.addOverlay(wardLayerRef.current, 'Ward Boundaries');
    }

    // Add assembly layer
    if (assemblyData && showAssembly) {
      assemblyLayerRef.current = L.geoJSON(assemblyData, {
        style: {
          color: '#e74c3c',
          weight: 4,
          fillColor: '#e74c3c',
          fillOpacity: 0.1,
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
      });
      
      assemblyLayerRef.current.addTo(mapInstanceRef.current);
      layerControlRef.current.addOverlay(assemblyLayerRef.current, 'Assembly Boundary');
    }

    // Fit map to show all data
    if (wardData || assemblyData) {
      const group = L.featureGroup([wardLayerRef.current, assemblyLayerRef.current].filter(Boolean));
      if (group.getLayers().length > 0) {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }
  }, [wardData, assemblyData, showWards, showAssembly]);

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
          Combined Ward & Assembly Boundaries
        </h2>

        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '15px',
          flexWrap: 'wrap'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px 12px',
            backgroundColor: showWards ? '#3498db' : '#ecf0f1',
            color: showWards ? 'white' : '#2c3e50',
            borderRadius: '4px',
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={showWards}
              onChange={(e) => setShowWards(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <div style={{ 
              width: '16px', 
              height: '16px', 
              backgroundColor: '#3498db', 
              marginRight: '8px',
              border: '1px solid #2c3e50'
            }}></div>
            Ward Boundaries
          </label>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            padding: '8px 12px',
            backgroundColor: showAssembly ? '#e74c3c' : '#ecf0f1',
            color: showAssembly ? 'white' : '#2c3e50',
            borderRadius: '4px',
            transition: 'all 0.3s ease'
          }}>
            <input
              type="checkbox"
              checked={showAssembly}
              onChange={(e) => setShowAssembly(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <div style={{ 
              width: '16px', 
              height: '16px', 
              backgroundColor: '#e74c3c', 
              marginRight: '8px',
              border: '1px solid #2c3e50'
            }}></div>
            Assembly Boundary
          </label>
        </div>

        {loading && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            Loading boundary data...
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

        {(wardData || assemblyData) && !loading && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#2ecc71', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <strong>✓ Boundary data loaded successfully</strong>
            {wardData && <span> • Ward boundaries available</span>}
            {assemblyData && <span> • Assembly boundary available</span>}
          </div>
        )}
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

      {/* Legend */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Legend & Features:</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px',
          fontSize: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '3px', 
                backgroundColor: '#3498db', 
                marginRight: '10px'
              }}></div>
              <strong>Ward Boundaries</strong> - Individual administrative wards
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '3px', 
                marginRight: '10px',
                borderTop: '3px dashed #e74c3c',
                backgroundColor: 'transparent'
              }}></div>
              <strong>Assembly Boundary</strong> - C.V. RamannNagar constituency
            </div>
          </div>
          <div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Click on boundaries to see detailed information</li>
              <li>Use checkboxes to toggle layers on/off</li>
              <li>Layer control in top-right for advanced options</li>
              <li>Zoom and pan to explore different areas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedBoundaryMap;