import { LoginRateLimiter } from "./login-rate-limit";

describe("LoginRateLimiter", () => {
  const KEY = "user@example.com:127.0.0.1";
  const WINDOW_MS = 15 * 60 * 1000;

  it("allows attempts when there is no history", () => {
    const limiter = new LoginRateLimiter();
    expect(limiter.check(KEY, 0)).toEqual({ blocked: false });
  });

  it("blocks after 5 failures within the window", () => {
    const limiter = new LoginRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      limiter.recordFailure(KEY, now + i);
    }
    expect(limiter.check(KEY, now + 5)).toEqual({ blocked: true });
  });

  it("does not block before the 5th failure", () => {
    const limiter = new LoginRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 4; i++) {
      limiter.recordFailure(KEY, now + i);
    }
    expect(limiter.check(KEY, now + 4)).toEqual({ blocked: false });
  });

  it("recordSuccess clears the counter", () => {
    const limiter = new LoginRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      limiter.recordFailure(KEY, now + i);
    }
    expect(limiter.check(KEY, now + 5)).toEqual({ blocked: true });

    limiter.recordSuccess(KEY, now + 6);

    expect(limiter.check(KEY, now + 7)).toEqual({ blocked: false });
  });

  it("does not count failures older than the 15-minute window", () => {
    const limiter = new LoginRateLimiter();
    const start = 1_000_000;

    // One failure, then let the window fully expire before the next 5.
    limiter.recordFailure(KEY, start);

    const laterStart = start + WINDOW_MS + 1;
    for (let i = 0; i < 4; i++) {
      limiter.recordFailure(KEY, laterStart + i);
    }

    // Only 4 failures within the current window -> not blocked yet.
    expect(limiter.check(KEY, laterStart + 4)).toEqual({ blocked: false });

    limiter.recordFailure(KEY, laterStart + 4);

    // Now 5 failures within the current window -> blocked.
    expect(limiter.check(KEY, laterStart + 5)).toEqual({ blocked: true });
  });

  it("expires a block once the window has passed since the first failure", () => {
    const limiter = new LoginRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      limiter.recordFailure(KEY, now + i);
    }
    expect(limiter.check(KEY, now + 5)).toEqual({ blocked: true });

    // Well past the window since the first recorded failure.
    expect(limiter.check(KEY, now + WINDOW_MS + 1)).toEqual({ blocked: false });
  });

  it("tracks separate keys independently", () => {
    const limiter = new LoginRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      limiter.recordFailure(KEY, now + i);
    }
    expect(limiter.check("other@example.com:10.0.0.1", now + 5)).toEqual({ blocked: false });
  });
});
