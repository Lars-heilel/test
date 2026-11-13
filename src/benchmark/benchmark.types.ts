export interface DownloadAttempt {
  index: number;
  ok: boolean;
  status: number | null;
  bytes: number;
  durationMs: number;
  error: string | null;
}

export interface BenchmarkSummary {
  okCount: number;
  failCount: number;
  avgMs: number | null;
  totalBytes: number;
  totalMs: number;
  bytesPerSecond: number | null;
}

export interface BenchmarkResult {
  url: string;
  attempts: DownloadAttempt[];
  summary: BenchmarkSummary;
}

export interface BenchmarkOptions {
  count?: number;
  timeoutMs?: number;
}
