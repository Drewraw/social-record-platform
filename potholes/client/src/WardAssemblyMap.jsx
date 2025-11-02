import React, { useEffect } from 'react';
import L from 'leaflet';

const WARD_GEOJSON_URL = '/geojson/wards.assembly.geo.json';

const WardAssemblyMap = () => {
  useEffect(() => {
    const map = L.map('map').setView([12.9716, 77.5946], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    fetch(WARD_GEOJSON_URL)
      .then(res => res.json())
      .then(wardGeoJson => {
        L.geoJSON(wardGeoJson, {
          style: feature => ({
            color: 'purple',
            weight: 1,
            fillOpacity: 0.2
          }),
          onEachFeature: (feature, layer) => {
            const wardName = feature.properties.ward_name || feature.properties.name;
            const acName = feature.properties.assembly_constituency || feature.properties.AC_NAME;
            layer.bindPopup(`<b>Ward:</b> ${wardName}<br/><b>Assembly:</b> ${acName}`);
          }
        }).addTo(map);
      });
  }, []);

  return <div id="map" style={{ height: '600px', width: '100%' }} />;
};

export default WardAssemblyMap;
