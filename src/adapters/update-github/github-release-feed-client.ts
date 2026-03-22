import type { ReleaseFeedClient } from '../../application/ports/release-feed-client.js';
import type { ReleaseDescriptor } from '../../domain/updates/types.js';
import https from 'https';

const MSIX_SUFFIX = '-win-x64.msix';

export class GitHubReleaseFeedClient implements ReleaseFeedClient {
  constructor(private owner: string, private repo: string) {}

  async getLatestRelease(channel: string): Promise<ReleaseDescriptor | null> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
    const json = await this.fetchJson(url);
    if (!json) return null;

    const tagName: string = json.tag_name ?? '';
    const version = tagName.replace(/^v/, '');
    const isPrerelease: boolean = json.prerelease ?? false;
    if (isPrerelease && channel === 'stable') return null;

    const assets: any[] = json.assets ?? [];
    const msixAsset = assets.find((a: any) => (a.name as string).endsWith(MSIX_SUFFIX));
    if (!msixAsset) return null;

    return {
      version,
      publishedAtUtc: json.published_at ?? '',
      releaseUrl: json.html_url ?? '',
      channel: isPrerelease ? 'prerelease' : 'stable',
      installerAssetName: msixAsset.name,
      installerAssetUrl: msixAsset.browser_download_url,
      isPrerelease,
      releaseNotes: json.body ?? '',
    };
  }

  private fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { headers: { 'User-Agent': 'PrecisionDash/1.0', Accept: 'application/vnd.github+json' } }, (res) => {
        if (res.statusCode === 404) { resolve(null); return; }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
      });
      req.on('error', reject);
    });
  }
}
