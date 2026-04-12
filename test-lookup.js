import { resolveProfile } from './dist/domain/telemetry/car-profiles.js';

const mockMe = (path) => {
  const profile = resolveProfile(1, path, 1, 8000);
  console.log(`Path: "${path}" -> Profile Found: ${!!profile}`);
  if (profile) {
    console.log(`  LED Count: ${profile.ledRpms.length}`);
  }
};

console.log('--- Verification: iRacing 2024 versions ---');
mockMe('stockcars ford mustang nextgen 2024');
mockMe('stockcars chevrolet camaro nextgen 2024');
mockMe('stockcars toyota camry nextgen 2024');

