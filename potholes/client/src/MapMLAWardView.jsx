import React, { useEffect } from 'react';
import L from 'leaflet';
import Papa from 'papaparse';

const AC_BOUNDARY_URL = '/geojson/AC_Boundary.json';
const WARD_DATA_URL = '/geojson/gba_wards_geocoding_input.csv';

const MapMLAWardView = () => {
  useEffect(() => {
    const map = L.map('map').setView([12.9716, 77.5946], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    Promise.all([
      fetch(AC_BOUNDARY_URL).then(res => res.json()),
      fetch(WARD_DATA_URL).then(res => res.text())
    ]).then(([acBoundary, wardCsv]) => {
      const wardData = Papa.parse(wardCsv, { header: true }).data;
      acBoundary.features.forEach(feature => {
        const acName = feature.properties.name || feature.properties.AC_NAME;
        const wardsInAC = wardData.filter(w => w['assembly constituency'] === acName);
        L.geoJSON(feature, {
          style: { color: 'blue', weight: 2, fillOpacity: 0.1 },
          onEachFeature: (f, layer) => {
            layer.bindPopup(acName);
          }
        }).addTo(map);
        wardsInAC.forEach(ward => {
          if (ward.lat && ward.lon) {
            L.marker([parseFloat(ward.lat), parseFloat(ward.lon)])
              .bindPopup(`${ward.ward_name} (${acName})`)
              .addTo(map);
          }
        });
      });
    });
  }, []);

  return <div id="map" style={{ height: '600px', width: '100%' }} />;
};

export default MapMLAWardView;
