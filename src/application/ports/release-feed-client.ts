import type { ReleaseDescriptor } from '../../domain/updates/types.js';

export interface ReleaseFeedClient {
  getLatestRelease(channel: string): Promise<ReleaseDescriptor | null>;
}
