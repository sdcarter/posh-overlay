import https from 'https';

const BASE = 'https://raw.githubusercontent.com/Lovely-Sim-Racing/lovely-car-data/main/data';

export interface LovelyCarData {
  carName: string;
  carId: string;
  carClass: string;
  ledNumber: number;
  redlineBlinkInterval: number;
  ledColor: string[];
  ledRpm: Array<Record<string, number[]>>;
}

const cache = new Map<string, LovelyCarData | null>();

export async function fetchCarData(carPath: string): Promise<LovelyCarData | null> {
  if (cache.has(carPath)) return cache.get(carPath) ?? null;

  try {
    const json = await fetchJson(`${BASE}/iracing/${carPath}.json`);
    cache.set(carPath, json);
    return json;
  } catch {
    cache.set(carPath, null);
    return null;
  }
}

function fetchJson(url: string): Promise<LovelyCarData | null> {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'PoshDash/1.0' } }, (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}
