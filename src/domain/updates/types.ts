export type UpdateStatus = 'up-to-date' | 'update-available' | 'ineligible' | 'check-failed';

export interface UpdateDecision {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion?: string;
  reason?: string;
  checkedAtUtc: string;
}

export type TransactionState = 'started' | 'downloaded' | 'verified' | 'prompted' | 'deferred' | 'installing' | 'installed' | 'failed';
export type UserDecision = 'none' | 'install-now' | 'defer';

export interface UpdateTransaction {
  transactionId: string;
  targetVersion: string;
  state: TransactionState;
  startedAtUtc: string;
  completedAtUtc?: string;
  failureReason?: string;
  userDecision: UserDecision;
  stagedAssetPath?: string;
}

export interface ReleaseDescriptor {
  version: string;
  publishedAtUtc: string;
  releaseUrl: string;
  channel: string;
  installerAssetName: string;
  installerAssetUrl: string;
  isPrerelease: boolean;
  releaseNotes: string;
}

export interface InstalledApplicationRecord {
  productId: string;
  installedVersion: string;
  installLocation: string;
  channel: string;
  installedAtUtc: string;
}
