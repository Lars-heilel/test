import { Inject, Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import {
  DEFAULT_TIMEOUT_MS,
  FETCH_CLIENT,
  FetchClient,
  REQUEST_COUNT,
} from './benchmark.constants';
import {
  BenchmarkOptions,
  BenchmarkResult,
  DownloadAttempt,
} from './benchmark.types';
import { summarize } from './summary';

@Injectable()
export class BenchmarkService {
  constructor(
    @Inject(FETCH_CLIENT) private readonly fetchClient: FetchClient,
  ) {}

  async run(
    url: string,
    options: BenchmarkOptions = {},
  ): Promise<BenchmarkResult> {
    const count = options.count ?? REQUEST_COUNT;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const attempts: DownloadAttempt[] = [];

    for (let index = 0; index < count; index++) {
      attempts.push(await this.downloadOnce(url, index, timeoutMs));
    }

    return { url, attempts, summary: summarize(attempts) };
  }

  private async downloadOnce(
    url: string,
    index: number,
    timeoutMs: number,
  ): Promise<DownloadAttempt> {
    const startedAt = performance.now();

    try {
      const response = await this.fetchClient(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
      });

      // Await the whole body so the measurement includes transfer time.
      const body = await response.arrayBuffer();
      const durationMs = performance.now() - startedAt;

      if (!response.ok) {
        return {
          index,
          ok: false,
          status: response.status,
          bytes: 0,
          durationMs,
          error: `HTTP ${response.status} ${response.statusText}`.trim(),
        };
      }

      return {
        index,
        ok: true,
        status: response.status,
        bytes: body.byteLength,
        durationMs,
        error: null,
      };
    } catch (error) {
      return {
        index,
        ok: false,
        status: null,
        bytes: 0,
        durationMs: performance.now() - startedAt,
        error: this.describeError(error, timeoutMs),
      };
    }
  }

  private describeError(error: unknown, timeoutMs: number): string {
    if (!(error instanceof Error) && typeof error === 'object' && error !== null) {
      const named = error as { name?: string; message?: string };
      if (named.name === 'TimeoutError') {
        return `таймаут ${timeoutMs} мс`;
      }
      if (typeof named.message === 'string') {
        return named.message;
      }
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      return `таймаут ${timeoutMs} мс`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
