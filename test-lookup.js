import { resolveProfile } from './dist/domain/telemetry/car-profiles.js';

const mockMe = (path) => {
  const profile = resolveProfile(1, path, 1, 8000);
  console.log(`Path: "${path}" -> Profile Found: ${!!profile}`);
  if (profile) {
    console.log(`  LED Count: ${profile.ledRpms.length}`);
  }
};

console.log('--- Verification: Future-proof Specificity Matching ---');
mockMe('stockcars/ford-mustang-nextgen-2024'); // Reality
mockMe('stockcars/ford-mustang-nextgen-2028'); // Future version - FIXED
mockMe('ford mustang nextgen');                // Partial - Step 3 (Reverse match)
mockMe('stockcars/chevy-monte-carlo-03');      // Gen4 reality
mockMe('stockcars/chevrolet-camaro-nextgen');  // Next Gen reality
mockMe('stockcars2/chevrolet-camaro');         // Xfinity/O'Reilly reality
mockMe('stockcars2/ford-mustang');            // Xfinity/O'Reilly reality
mockMe('stockcars2/toyota-supra');            // Xfinity/O'Reilly reality
mockMe('stockcars/toyota-camry-nextgen-2024'); // Next Gen Reality
mockMe('stockcars/nascar-next-gen-ford-2024'); // What if reordered? - Step 4 (fuzzy)

