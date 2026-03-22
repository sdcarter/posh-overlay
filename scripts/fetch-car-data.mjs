#!/usr/bin/env node
// Fetches all iRacing car data from Lovely Sim Racing and writes a single JSON bundle.
// Run: node scripts/fetch-car-data.mjs

import https from 'https';
import fs from 'fs';
import path from 'path';

const MANIFEST_URL = 'https://raw.githubusercontent.com/Lovely-Sim-Racing/lovely-car-data/main/data/manifest.json';
const BASE = 'https://raw.githubusercontent.com/Lovely-Sim-Racing/lovely-car-data/main/data';
const OUT = path.resolve('src/domain/telemetry/lovely-car-data.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PoshDash/1.0' } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return; }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching manifest...');
  const manifest = await fetchJson(MANIFEST_URL);
  const iracingCars = manifest.cars?.iracing ?? [];
  console.log(`Found ${iracingCars.length} iRacing cars`);

  const bundle = {};
  for (const car of iracingCars) {
    const url = `${BASE}/${car.path}`;
    try {
      const data = await fetchJson(url);
      bundle[car.carId] = data;
      console.log(`  ✓ ${car.carId}`);
    } catch (e) {
      console.log(`  ✗ ${car.carId}: ${e.message}`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(bundle, null, 2));
  console.log(`\nWrote ${Object.keys(bundle).length} cars to ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
