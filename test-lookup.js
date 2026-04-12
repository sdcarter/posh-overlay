import { resolveProfile } from './src/domain/telemetry/car-profiles.js';

const mockMe = (path) => {
  const profile = resolveProfile(1, path, 1, 8000);
  console.log(`Path: "${path}" -> Profile Found: ${!!profile}`);
  if (profile) {
    console.log(`  LED Count: ${profile.ledRpms.length}`);
  }
};

mockMe('nascar-ford-mustang-nextgen');
mockMe('stockcars ford mustang nextgen');
mockMe('ford mustang nextgen');
mockMe('nascar ford mustang nextgen');
