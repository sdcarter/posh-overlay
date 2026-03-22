import type { ReleaseFeedClient } from '../../application/ports/release-feed-client.js';
import type { ReleaseDescriptor } from '../../domain/updates/types.js';
import https from 'https';

const MSIX_SUFFIX = '-win-x64.msix';

interface GitHubRelease {
  tag_name?: string;
  prerelease?: boolean;
  published_at?: string;
  html_url?: string;
  body?: string;
  assets?: GitHubAsset[];
}

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

export class GitHubReleaseFeedClient implements ReleaseFeedClient {
  constructor(private owner: string, private repo: string) {}

  async getLatestRelease(channel: string): Promise<ReleaseDescriptor | null> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
    const json = await this.fetchJson(url);
    if (!json) return null;

    const tagName = json.tag_name ?? '';
    const version = tagName.replace(/^v/, '');
    const isPrerelease = json.prerelease ?? false;
    if (isPrerelease && channel === 'stable') return null;

    const assets = json.assets ?? [];
    const msixAsset = assets.find((a) => a.name.endsWith(MSIX_SUFFIX));
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

  private fetchJson(url: string): Promise<GitHubRelease | null> {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { headers: { 'User-Agent': 'PoshDash/1.0', Accept: 'application/vnd.github+json' } }, (res) => {
        if (res.statusCode === 404) { resolve(null); return; }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
      });
      req.on('error', reject);
    });
  }
}
