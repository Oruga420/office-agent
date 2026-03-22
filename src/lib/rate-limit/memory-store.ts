interface TimestampEntry {
  readonly userId: string;
  readonly timestamp: number;
}

interface UserWindow {
  readonly entries: readonly TimestampEntry[];
}

const store = new Map<string, UserWindow>();

function pruneExpired(window: UserWindow, cutoff: number): UserWindow {
  const entries = window.entries.filter((e) => e.timestamp > cutoff);
  return { entries };
}

function addEntry(window: UserWindow, userId: string, now: number): UserWindow {
  return {
    entries: [...window.entries, { userId, timestamp: now }],
  };
}

function getWindow(userId: string): UserWindow {
  return store.get(userId) ?? { entries: [] };
}

export function countSince(userId: string, since: number): number {
  const window = getWindow(userId);
  return window.entries.filter((e) => e.timestamp > since).length;
}

export function recordRequest(userId: string): void {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  const current = getWindow(userId);
  const pruned = pruneExpired(current, hourAgo);
  const updated = addEntry(pruned, userId, now);

  store.set(userId, updated);
}

function resetStore(): void {
  store.clear();
}
