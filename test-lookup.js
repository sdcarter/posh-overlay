import { resolveProfile } from './dist/domain/telemetry/car-profiles.js';

const mockMe = (path) => {
  const profile = resolveProfile(1, path, 1, 8000);
  console.log(`Path: "${path}" -> Profile Found: ${!!profile}`);
  if (profile) {
    console.log(`  LED Count: ${profile.ledRpms.length}`);
  }
};

console.log('--- Verification: Exact Matching with Updated Data ---');
mockMe('stockcars fordmustang2022');        // Next Gen Mustang (exact)
mockMe('stockcars2 mustang2019');           // O\'Reilly Mustang (exact)
mockMe('stockcars2 camaro2019');            // O\'Reilly Camaro (exact)
mockMe('stockcars chevroletcamaro2022');    // Next Gen Camaro (exact)
mockMe('stockcars toyotacamry2022');        // Next Gen Camry (exact)


