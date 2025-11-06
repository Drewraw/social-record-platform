import React, { useEffect } from 'react';
import L from 'leaflet';

const MapView = () => {
  useEffect(() => {
    const map = L.map('map').setView([12.9716, 77.5946], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    Promise.all([
      fetch('/geojson/all.AC-boundary.json').then(res => {
        if (!res.ok) throw new Error('Failed to fetch AC boundary GeoJSON');
        return res.json();
      }),
      fetch('/geojson/ZONE_MapToKML.json').then(res => {
        if (!res.ok) throw new Error('Failed to fetch Zone boundary GeoJSON');
        return res.json();
      })
    ]).then(([acBoundary, zoneBoundary]) => {
      if (!acBoundary || !acBoundary.features || acBoundary.features.length === 0) {
        console.error('AC boundary GeoJSON is empty or invalid:', acBoundary);
      } else {
        L.geoJSON(acBoundary, {
          style: { color: 'blue', weight: 2, fillOpacity: 0.1 },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(feature.properties.name || feature.properties.AC_NAME || 'Assembly Constituency');
          }
        }).addTo(map);
        console.log('AC boundaries loaded:', acBoundary.features.length);
      }
      if (!zoneBoundary || !zoneBoundary.features || zoneBoundary.features.length === 0) {
        console.error('Zone boundary GeoJSON is empty or invalid:', zoneBoundary);
      } else {
        L.geoJSON(zoneBoundary, {
          style: { color: 'green', weight: 2, fillOpacity: 0.05 },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(feature.properties.zone_name || feature.properties.ZONE_NAME || 'Zone');
          }
        }).addTo(map);
        console.log('Zone boundaries loaded:', zoneBoundary.features.length);
      }
    }).catch(err => {
      console.error('Error loading boundaries:', err);
    });
  }, []);

  return <div id="map" style={{ height: '600px', width: '100%' }} />;
};

export default MapView;
