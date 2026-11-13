import { BenchmarkResult } from '../benchmark/benchmark.types';
import { scoreAttempts } from '../../test-support/score-attempts';
import { formatBytes, formatDuration, formatReport } from './report.formatter';

describe('report formatter', () => {
  it('formats bytes with decimal units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1000)).toBe('1.00 KB');
    expect(formatBytes(1_500_000)).toBe('1.50 MB');
  });

  it('formats duration in milliseconds with one decimal', () => {
    expect(formatDuration(123.44)).toBe('123.4 мс');
    expect(formatDuration(0)).toBe('0.0 мс');
  });

  it('includes request count, units and speed in the report', () => {
    const attempts = scoreAttempts(10, 1000, 100);
    const result: BenchmarkResult = {
      url: 'http://example.test/file.jpg',
      attempts,
      summary: {
        okCount: 10,
        failCount: 0,
        avgMs: 100,
        totalBytes: 10_000,
        totalMs: 1000,
        bytesPerSecond: 10_000,
      },
    };

    const report = formatReport(result);

    expect(report).toContain('Запросов: 10');
    expect(report).toContain('100.0 мс');
    expect(report).toContain('10.00 KB');
    expect(report).toContain('10.00 KB/с');
  });

  it('prints n/a for unavailable speed', () => {
    const result: BenchmarkResult = {
      url: 'http://example.test/empty',
      attempts: scoreAttempts(2, 0, 10),
      summary: {
        okCount: 2,
        failCount: 0,
        avgMs: 10,
        totalBytes: 0,
        totalMs: 20,
        bytesPerSecond: null,
      },
    };

    expect(formatReport(result)).toContain('н/д (нет данных)');
  });

  it('lists failed attempts with their errors', () => {
    const result: BenchmarkResult = {
      url: 'http://example.test/broken',
      attempts: [
        {
          index: 0,
          ok: false,
          status: 500,
          bytes: 0,
          durationMs: 5,
          error: 'HTTP 500 Internal Server Error',
        },
      ],
      summary: {
        okCount: 0,
        failCount: 1,
        avgMs: null,
        totalBytes: 0,
        totalMs: 0,
        bytesPerSecond: null,
      },
    };

    const report = formatReport(result);

    expect(report).toContain('Ошибки:');
    expect(report).toContain('HTTP 500');
  });
});
