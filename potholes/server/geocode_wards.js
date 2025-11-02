// Script to geocode ward names using Nominatim (OpenStreetMap)
// Usage: node geocode_wards.js

import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const inputPath = path.join(process.cwd(), 'new.json');
const outputPath = path.join(process.cwd(), 'new_with_coords.json');

async function geocodeWard(wardName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(wardName + ', Bangalore')}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'social-record-platform/1.0' } });
    const data = await res.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
  } catch (e) {
    console.error('Error geocoding', wardName, e);
  }
  return { lat: null, lon: null };
}

async function main() {
  const json = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const nameIndex = json.fields.findIndex(f => f.id === 'name_en');
  if (nameIndex === -1) throw new Error('name_en field not found');

  // Add lat/lon fields if not present
  if (!json.fields.find(f => f.id === 'lat')) json.fields.push({ type: 'text', id: 'lat' });
  if (!json.fields.find(f => f.id === 'lon')) json.fields.push({ type: 'text', id: 'lon' });

  for (let i = 0; i < json.records.length; i++) {
    const wardName = json.records[i][nameIndex];
    const coords = await geocodeWard(wardName);
    json.records[i].push(coords.lat, coords.lon);
    console.log(`Geocoded ${wardName}: ${coords.lat}, ${coords.lon}`);
    // To avoid hitting rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync(outputPath, JSON.stringify(json, null, 2));
  console.log('Done! Output written to', outputPath);
}

main();
