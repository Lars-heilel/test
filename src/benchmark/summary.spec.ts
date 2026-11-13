import { DownloadAttempt } from './benchmark.types';
import { summarize } from './summary';

function ok(index: number, bytes: number, durationMs: number): DownloadAttempt {
  return { index, ok: true, status: 200, bytes, durationMs, error: null };
}

function failed(index: number, error = 'boom'): DownloadAttempt {
  return {
    index,
    ok: false,
    status: null,
    bytes: 0,
    durationMs: 50,
    error,
  };
}

describe('summarize', () => {
  it('computes average, total bytes and speed for 10 successful attempts', () => {
    const attempts = Array.from({ length: 10 }, (_, i) => ok(i, 1000, 100));
    const summary = summarize(attempts);

    expect(summary).toEqual({
      okCount: 10,
      failCount: 0,
      avgMs: 100,
      totalBytes: 10_000,
      totalMs: 1000,
      bytesPerSecond: 10_000,
    });
  });

  it('averages over successful attempts only', () => {
    const summary = summarize([
      ok(0, 2000, 200),
      ok(1, 4000, 400),
      failed(2),
      failed(3),
    ]);

    expect(summary.okCount).toBe(2);
    expect(summary.failCount).toBe(2);
    expect(summary.avgMs).toBe(300);
    expect(summary.totalBytes).toBe(6000);
    expect(summary.bytesPerSecond).toBe(10_000);
  });

  it('reports unavailable metrics when every attempt failed', () => {
    const summary = summarize([failed(0), failed(1)]);

    expect(summary.okCount).toBe(0);
    expect(summary.avgMs).toBeNull();
    expect(summary.bytesPerSecond).toBeNull();
  });

  it('does not divide by zero for empty bodies', () => {
    const summary = summarize([ok(0, 0, 10), ok(1, 0, 10)]);

    expect(summary.totalBytes).toBe(0);
    expect(summary.bytesPerSecond).toBeNull();
  });
});
