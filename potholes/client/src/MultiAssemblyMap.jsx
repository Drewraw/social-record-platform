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

const MultiAssemblyMap = () => {
  const [selectedAssemblies, setSelectedAssemblies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedCount, setLoadedCount] = useState(0);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});

  // List of all available assembly constituencies with colors
  const assemblies = [
    { value: 'Anekal', label: 'Anekal', color: '#e74c3c' },
    { value: 'B.T.M_Layout', label: 'B.T.M Layout', color: '#3498db' },
    { value: 'Bangalore_South', label: 'Bangalore South', color: '#2ecc71' },
    { value: 'Basavanagudi', label: 'Basavanagudi', color: '#f39c12' },
    { value: 'Bommanahalli', label: 'Bommanahalli', color: '#9b59b6' },
    { value: 'Byatarayanapura', label: 'Byatarayanapura', color: '#1abc9c' },
    { value: 'C.V._RamannNagar', label: 'C.V. RamannNagar', color: '#e67e22' },
    { value: 'Chamrajapet', label: 'Chamrajapet', color: '#34495e' },
    { value: 'Chickpet', label: 'Chickpet', color: '#f1c40f' },
    { value: 'Dasarahalli', label: 'Dasarahalli', color: '#8e44ad' },
    { value: 'Hebbal', label: 'Hebbal', color: '#16a085' },
    { value: 'Jayanagar', label: 'Jayanagar', color: '#d35400' },
    { value: 'K.R._Pura', label: 'K.R. Pura', color: '#2980b9' },
    { value: 'Mahadevapura', label: 'Mahadevapura', color: '#27ae60' },
    { value: 'Mahalakshmi_Layout', label: 'Mahalakshmi Layout', color: '#c0392b' },
    { value: 'Malleshwaram', label: 'Malleshwaram', color: '#7f8c8d' },
    { value: 'Padmanabanagar', label: 'Padmanabanagar', color: '#d68910' },
    { value: 'Pulakeshinagar', label: 'Pulakeshinagar', color: '#6c3483' },
    { value: 'Rajajinagar', label: 'Rajajinagar', color: '#138d75' },
    { value: 'Rajarajeshwarinagar', label: 'Rajarajeshwarinagar', color: '#a04000' },
    { value: 'Sarvagnanagar', label: 'Sarvagnanagar', color: '#1f618d' },
    { value: 'Shivajinagar', label: 'Shivajinagar', color: '#196f3d' },
    { value: 'Vijayanagar', label: 'Vijayanagar', color: '#922b21' },
    { value: 'Yelahanka', label: 'Yelahanka', color: '#5d6d7e' },
    { value: 'Yeshwanthapura', label: 'Yeshwanthapura', color: '#b7950b' }
  ];

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([12.9716, 77.5946], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add layer control
      const layerControl = L.control.layers(null, null, {
        position: 'topright',
        collapsed: false
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Load assembly boundary
  const loadAssemblyBoundary = async (assemblyName, color) => {
    try {
      const response = await fetch(`http://localhost:5000/${assemblyName}_boundary.geojson`);
      if (!response.ok) {
        throw new Error(`Failed to load ${assemblyName}`);
      }
      
      const data = await response.json();
      
      // Create layer with unique color
      const layer = L.geoJSON(data, {
        style: {
          color: color,
          weight: 3,
          fillColor: color,
          fillOpacity: 0.2,
          dashArray: '5, 5'
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const name = feature.properties.assembly || assemblyName;
            layer.bindPopup(`
              <div style="font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: ${color};">${name}</h3>
                <p style="margin: 5px 0;"><strong>Type:</strong> Assembly Constituency</p>
                <p style="margin: 5px 0;"><strong>State:</strong> Karnataka</p>
                <p style="margin: 5px 0;"><strong>City:</strong> Bengaluru</p>
                <div style="width: 20px; height: 20px; background: ${color}; border: 2px solid #333; margin-top: 10px;"></div>
              </div>
            `);
          }
        }
      });
      
      layersRef.current[assemblyName] = layer;
      layer.addTo(mapInstanceRef.current);
      
      return layer;
    } catch (err) {
      console.error(`Error loading ${assemblyName}:`, err);
      throw err;
    }
  };

  // Handle assembly checkbox change
  const handleAssemblyToggle = async (assemblyValue, isChecked) => {
    if (isChecked) {
      setSelectedAssemblies(prev => [...prev, assemblyValue]);
      setLoading(true);
      
      try {
        const assembly = assemblies.find(a => a.value === assemblyValue);
        await loadAssemblyBoundary(assemblyValue, assembly.color);
        setLoadedCount(prev => prev + 1);
      } catch (err) {
        setError(`Failed to load ${assemblyValue}: ${err.message}`);
        setSelectedAssemblies(prev => prev.filter(a => a !== assemblyValue));
      } finally {
        setLoading(false);
      }
    } else {
      // Remove assembly
      setSelectedAssemblies(prev => prev.filter(a => a !== assemblyValue));
      
      if (layersRef.current[assemblyValue]) {
        mapInstanceRef.current.removeLayer(layersRef.current[assemblyValue]);
        delete layersRef.current[assemblyValue];
        setLoadedCount(prev => prev - 1);
      }
    }
  };

  // Load all assemblies
  const loadAllAssemblies = async () => {
    setLoading(true);
    setError('');
    setSelectedAssemblies(assemblies.map(a => a.value));
    
    try {
      for (const assembly of assemblies) {
        await loadAssemblyBoundary(assembly.value, assembly.color);
      }
      setLoadedCount(assemblies.length);
    } catch (err) {
      setError(`Failed to load all assemblies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear all assemblies
  const clearAllAssemblies = () => {
    Object.values(layersRef.current).forEach(layer => {
      mapInstanceRef.current.removeLayer(layer);
    });
    layersRef.current = {};
    setSelectedAssemblies([]);
    setLoadedCount(0);
    setError('');
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
          Multiple Assembly Constituencies Map
        </h2>

        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={loadAllAssemblies}
            disabled={loading}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Load All Assemblies
          </button>
          
          <button
            onClick={clearAllAssemblies}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Clear All
          </button>
        </div>

        {loading && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            Loading assembly boundaries...
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

        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ecf0f1', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>Loaded: {loadedCount} / {assemblies.length} assemblies</strong>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '10px',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #bdc3c7',
          padding: '15px',
          borderRadius: '5px',
          backgroundColor: 'white'
        }}>
          {assemblies.map(assembly => (
            <label
              key={assembly.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                border: `2px solid ${assembly.color}`,
                borderRadius: '4px',
                backgroundColor: selectedAssemblies.includes(assembly.value) ? 
                  `${assembly.color}20` : 'transparent',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={selectedAssemblies.includes(assembly.value)}
                onChange={(e) => handleAssemblyToggle(assembly.value, e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: assembly.color,
                  marginRight: '8px',
                  border: '1px solid #333'
                }}
              ></div>
              <span style={{ fontSize: '14px', color: '#2c3e50' }}>
                {assembly.label}
              </span>
            </label>
          ))}
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
        <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Features:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Select individual assembly constituencies using checkboxes</li>
          <li>Each constituency has a unique color for easy identification</li>
          <li>Load all 25 assemblies at once with "Load All Assemblies"</li>
          <li>Clear all boundaries with "Clear All"</li>
          <li>Click on any boundary to see constituency information</li>
          <li>Each boundary shows the constituency color in its popup</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiAssemblyMap;