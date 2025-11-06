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

const AssemblySelector = () => {
  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [assemblyData, setAssemblyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentLayerRef = useRef(null);

  // List of all available assembly constituencies
  const assemblies = [
    { value: 'Anekal', label: 'Anekal' },
    { value: 'B.T.M_Layout', label: 'B.T.M Layout' },
    { value: 'Bangalore_South', label: 'Bangalore South' },
    { value: 'Basavanagudi', label: 'Basavanagudi' },
    { value: 'Bommanahalli', label: 'Bommanahalli' },
    { value: 'Byatarayanapura', label: 'Byatarayanapura' },
    { value: 'C.V._RamannNagar', label: 'C.V. RamannNagar' },
    { value: 'Chamrajapet', label: 'Chamrajapet' },
    { value: 'Chickpet', label: 'Chickpet' },
    { value: 'Dasarahalli', label: 'Dasarahalli' },
    { value: 'Hebbal', label: 'Hebbal' },
    { value: 'Jayanagar', label: 'Jayanagar' },
    { value: 'K.R._Pura', label: 'K.R. Pura' },
    { value: 'Mahadevapura', label: 'Mahadevapura' },
    { value: 'Mahalakshmi_Layout', label: 'Mahalakshmi Layout' },
    { value: 'Malleshwaram', label: 'Malleshwaram' },
    { value: 'Padmanabanagar', label: 'Padmanabanagar' },
    { value: 'Pulakeshinagar', label: 'Pulakeshinagar' },
    { value: 'Rajajinagar', label: 'Rajajinagar' },
    { value: 'Rajarajeshwarinagar', label: 'Rajarajeshwarinagar' },
    { value: 'Sarvagnanagar', label: 'Sarvagnanagar' },
    { value: 'Shivajinagar', label: 'Shivajinagar' },
    { value: 'Vijayanagar', label: 'Vijayanagar' },
    { value: 'Yelahanka', label: 'Yelahanka' },
    { value: 'Yeshwanthapura', label: 'Yeshwanthapura' }
  ];

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([12.9716, 77.5946], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load selected assembly boundary
  const loadAssemblyBoundary = async (assemblyName) => {
    if (!assemblyName) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:5000/${assemblyName}_boundary.geojson`);
      if (!response.ok) {
        throw new Error(`Failed to load ${assemblyName} boundary: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAssemblyData(data);
      
      // Remove previous layer if exists
      if (currentLayerRef.current) {
        mapInstanceRef.current.removeLayer(currentLayerRef.current);
      }
      
      // Add new boundary layer
      currentLayerRef.current = L.geoJSON(data, {
        style: {
          color: '#e74c3c',
          weight: 3,
          fillColor: '#e74c3c',
          fillOpacity: 0.2,
          dashArray: '10, 10'
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const assemblyName = feature.properties.assembly || assemblyName;
            layer.bindPopup(`
              <div style="font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${assemblyName}</h3>
                <p style="margin: 5px 0;"><strong>Type:</strong> Assembly Constituency</p>
                <p style="margin: 5px 0;"><strong>State:</strong> Karnataka</p>
                <p style="margin: 5px 0;"><strong>City:</strong> Bengaluru</p>
              </div>
            `);
          }
        }
      }).addTo(mapInstanceRef.current);
      
      // Fit map to boundary
      const bounds = currentLayerRef.current.getBounds();
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      
    } catch (err) {
      console.error('Error loading assembly boundary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle assembly selection
  const handleAssemblyChange = (event) => {
    const assembly = event.target.value;
    setSelectedAssembly(assembly);
    if (assembly) {
      loadAssemblyBoundary(assembly);
    } else if (currentLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentLayerRef.current);
      currentLayerRef.current = null;
      setAssemblyData(null);
    }
  };

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
          Bengaluru Assembly Constituencies
        </h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="assembly-select" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold',
            color: '#34495e'
          }}>
            Select Assembly Constituency:
          </label>
          <select
            id="assembly-select"
            value={selectedAssembly}
            onChange={handleAssemblyChange}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px',
              border: '2px solid #bdc3c7',
              borderRadius: '6px',
              fontSize: '16px',
              backgroundColor: 'white'
            }}
          >
            <option value="">-- Choose an Assembly Constituency --</option>
            {assemblies.map(assembly => (
              <option key={assembly.value} value={assembly.value}>
                {assembly.label}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            Loading {selectedAssembly} boundary...
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e74c3c', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            Error: {error}
          </div>
        )}

        {selectedAssembly && assemblyData && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#2ecc71', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <strong>Loaded:</strong> {assemblies.find(a => a.value === selectedAssembly)?.label} Assembly Constituency
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

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#ecf0f1', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#7f8c8d'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Instructions:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Select an assembly constituency from the dropdown above</li>
          <li>The boundary will be displayed on the map with red dashed lines</li>
          <li>Click on the boundary to see constituency information</li>
          <li>The map will automatically zoom to fit the selected constituency</li>
          <li>Choose a different constituency to switch boundaries</li>
        </ul>
      </div>
    </div>
  );
};

export default AssemblySelector;