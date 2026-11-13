import { BenchmarkResult } from '../benchmark/benchmark.types';

const BYTE_UNITS = [
  { limit: 1_000, suffix: 'B', factor: 1 },
  { limit: 1_000_000, suffix: 'KB', factor: 1_000 },
  { limit: 1_000_000_000, suffix: 'MB', factor: 1_000_000 },
  { limit: Number.POSITIVE_INFINITY, suffix: 'GB', factor: 1_000_000_000 },
];

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const unit = BYTE_UNITS.find((candidate) => bytes < candidate.limit)!;
  if (unit.suffix === 'B') {
    return `${bytes} B`;
  }
  return `${(bytes / unit.factor).toFixed(2)} ${unit.suffix}`;
}

export function formatDuration(ms: number): string {
  return `${ms.toFixed(1)} мс`;
}

export function formatReport(result: BenchmarkResult): string {
  const { attempts, summary } = result;
  const lines = [
    `Целевой адрес: ${result.url}`,
    `Запросов: ${attempts.length} (успешных: ${summary.okCount}, ошибок: ${summary.failCount})`,
    `Среднее время запроса: ${
      summary.avgMs === null ? 'н/д' : formatDuration(summary.avgMs)
    }`,
    `Всего скачано: ${formatBytes(summary.totalBytes)}`,
    `Скорость скачивания: ${
      summary.bytesPerSecond === null
        ? 'н/д (нет данных)'
        : `${formatBytes(summary.bytesPerSecond)}/с`
    }`,
  ];

  const errors = attempts.filter((attempt) => !attempt.ok);
  if (errors.length > 0) {
    lines.push('Ошибки:');
    for (const attempt of errors) {
      lines.push(`  #${attempt.index + 1}: ${attempt.error ?? 'неизвестно'}`);
    }
  }

  return lines.join('\n');
}
