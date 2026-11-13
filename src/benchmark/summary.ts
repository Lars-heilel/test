import { DownloadAttempt, BenchmarkSummary } from './benchmark.types';

/**
 * Aggregate attempts into metrics. Averages and speed use successful
 * downloads only, so failed requests never distort the result.
 */
export function summarize(attempts: DownloadAttempt[]): BenchmarkSummary {
  const successful = attempts.filter((attempt) => attempt.ok);
  const totalBytes = successful.reduce(
    (sum, attempt) => sum + attempt.bytes,
    0,
  );
  const totalMs = successful.reduce(
    (sum, attempt) => sum + attempt.durationMs,
    0,
  );

  return {
    okCount: successful.length,
    failCount: attempts.length - successful.length,
    avgMs: successful.length > 0 ? totalMs / successful.length : null,
    totalBytes,
    totalMs,
    bytesPerSecond:
      successful.length > 0 && totalBytes > 0 && totalMs > 0
        ? totalBytes / (totalMs / 1000)
        : null,
  };
}
