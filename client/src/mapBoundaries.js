import L from 'leaflet';
import acBoundary from '../../potholes/server/all.AC-boundary.json';
import zoneBoundary from '../../potholes/server/ZONE_MapToKML.json';

export function addBoundariesToMap(map) {
  // Assembly Constituency Boundaries
  L.geoJSON(acBoundary, {
    style: { color: 'blue', weight: 2, fillOpacity: 0.1 },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(feature.properties.name || feature.properties.AC_NAME || 'Assembly Constituency');
    }
  }).addTo(map);

  // Zone Boundaries
  L.geoJSON(zoneBoundary, {
    style: { color: 'green', weight: 2, fillOpacity: 0.05 },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(feature.properties.zone_name || feature.properties.ZONE_NAME || 'Zone');
    }
  }).addTo(map);
}
