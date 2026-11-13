import { DownloadAttempt } from '../src/benchmark/benchmark.types';

/** Build N successful attempts with the same byte size and duration. */
export function scoreAttempts(
  count: number,
  bytes: number,
  durationMs: number,
): DownloadAttempt[] {
  return Array.from({ length: count }, (_, index) => ({
    index,
    ok: true,
    status: 200,
    bytes,
    durationMs,
    error: null,
  }));
}
