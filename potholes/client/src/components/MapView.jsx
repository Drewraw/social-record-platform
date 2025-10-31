import React, { useEffect } from "react";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";

export default function MapView({ reports }) {
  useEffect(() => {
    const map = L.map("map").setView([22.97, 78.65], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap"
    }).addTo(map);

    // Add street search control
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      autoComplete: true,
    });
    map.addControl(searchControl);

    const layer = L.layerGroup().addTo(map);

    // ✅ Prevent crash if reports is undefined or not an array
    if (Array.isArray(reports)) {
      reports.forEach(r => {
        L.circleMarker([r.lat, r.lng], {
          color: "#FFA500",
          fillColor: "#FFA500",
          fillOpacity: 0.9,
          radius: 6
        })
        .bindPopup(`
          <div>
            <b>Report #${r.id}</b><br>
            <img src="${r.photo_url}" width="200" style="border-radius:8px;margin:5px 0;">
            <p>${r.description || ""}</p>
            <small>${new Date(r.created_at).toLocaleString()}</small>
          </div>
        `)
        .addTo(layer);
      });
    } else {
      console.warn("⚠️ Invalid reports data:", reports);
    }

    // ✅ Cleanup on unmount
    return () => map.remove();
  }, [reports]);

  // ✅ This should be outside useEffect — this is what actually renders the map div
  return <div id="map"></div>;
}
