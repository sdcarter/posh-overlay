import { resolveProfile } from './dist/domain/telemetry/car-profiles.js';

const mockMe = (path) => {
  const profile = resolveProfile(1, path, 1, 8000);
  console.log(`Path: "${path}" -> Profile Found: ${!!profile}`);
  if (profile) {
    console.log(`  LED Count: ${profile.ledRpms.length}`);
  }
};

console.log('--- Verification: Standard iRacing Car Paths ---');
mockMe('stockcars ford mustang nextgen');
mockMe('stockcars chevrolet camaro nextgen');
mockMe('stockcars toyota camry nextgen');
mockMe('stockcars2 ford mustang');
mockMe('stockcars chevy monte carlo 03');
mockMe('bmwm4gt3');

