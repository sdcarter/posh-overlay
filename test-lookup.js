import { resolveProfile } from './src/domain/telemetry/car-profiles.js';

const mockMe = (path) => {
  const profile = resolveProfile(1, path, 1, 8000);
  console.log(`Path: "${path}" -> Profile Found: ${!!profile}`);
  if (profile) {
    console.log(`  LED Count: ${profile.ledRpms.length}`);
  }
};

mockMe('stockcars-nascarnextgenford');
mockMe('stockcars2-oreillyford');
mockMe('stockcars-chevymontecarlo03');
mockMe('bmwm4gt3');
