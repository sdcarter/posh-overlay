import { randomUUID } from 'crypto';
import type { UpdateDecision, UpdateTransaction, TransactionState, UserDecision } from './types.js';

export function upToDate(currentVersion: string): UpdateDecision {
  return { status: 'up-to-date', currentVersion, checkedAtUtc: new Date().toISOString() };
}

export function available(currentVersion: string, availableVersion: string): UpdateDecision {
  return { status: 'update-available', currentVersion, availableVersion, checkedAtUtc: new Date().toISOString() };
}

export function checkFailed(currentVersion: string, reason: string): UpdateDecision {
  return { status: 'check-failed', currentVersion, reason, checkedAtUtc: new Date().toISOString() };
}

export function beginTransaction(targetVersion: string): UpdateTransaction {
  return {
    transactionId: randomUUID(),
    targetVersion,
    state: 'started',
    startedAtUtc: new Date().toISOString(),
    userDecision: 'none',
  };
}

export function withState(tx: UpdateTransaction, state: TransactionState): UpdateTransaction {
  return { ...tx, state };
}

export function withFailure(tx: UpdateTransaction, reason: string): UpdateTransaction {
  return { ...tx, state: 'failed', failureReason: reason, completedAtUtc: new Date().toISOString() };
}

export function withDecision(tx: UpdateTransaction, decision: UserDecision): UpdateTransaction {
  return { ...tx, userDecision: decision };
}

export function completed(tx: UpdateTransaction): UpdateTransaction {
  return { ...tx, state: 'installed', completedAtUtc: new Date().toISOString() };
}
