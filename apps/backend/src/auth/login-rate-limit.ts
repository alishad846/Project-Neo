import { Injectable } from "@nestjs/common";

const WINDOW_MS = 15 * 60 * 1000;
const THRESHOLD = 5;

interface Entry {
  count: number;
  firstAt: number;
}

/**
 * Pure, deterministic counting logic for login brute-force protection.
 *
 * `now` is always passed in by the caller (never read internally) so this
 * class stays trivially unit-testable without fake timers.
 *
 * NOTE: state lives in an in-process Map, so this only protects a single
 * backend instance. If/when the backend is horizontally scaled, replace
 * the Map with a shared store (e.g. Redis) keyed the same way.
 */
@Injectable()
export class LoginRateLimiter {
  private readonly attempts = new Map<string, Entry>();

  check(key: string, now: number): { blocked: boolean } {
    const entry = this.attempts.get(key);
    if (!entry) return { blocked: false };

    if (now - entry.firstAt >= WINDOW_MS) {
      this.attempts.delete(key);
      return { blocked: false };
    }

    return { blocked: entry.count >= THRESHOLD };
  }

  recordFailure(key: string, now: number): void {
    const entry = this.attempts.get(key);

    if (!entry || now - entry.firstAt >= WINDOW_MS) {
      this.attempts.set(key, { count: 1, firstAt: now });
      return;
    }

    entry.count += 1;
  }

  recordSuccess(key: string, now: number): void {
    void now;
    this.attempts.delete(key);
  }
}
