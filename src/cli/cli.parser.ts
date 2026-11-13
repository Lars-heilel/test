export const USAGE = `Использование: download-benchmark <url>

Скачивает указанный адрес 10 раз последовательно и печатает
среднее время запроса, суммарный объём и скорость скачивания.

Опции:
  -h, --help    показать эту справку

Пример:
  download-benchmark https://example.com/image.jpg`;

export type ParsedCommand =
  | { kind: 'run'; url: string }
  | { kind: 'help' }
  | { kind: 'error'; message: string; showUsage: boolean };

export function parseCliArgs(argv: readonly string[]): ParsedCommand {
  if (argv.includes('-h') || argv.includes('--help')) {
    return { kind: 'help' };
  }

  const url = argv[0];

  if (url === undefined) {
    return {
      kind: 'error',
      message: 'Ошибка: не указан адрес.',
      showUsage: true,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      kind: 'error',
      message: `Ошибка: некорректный URL "${url}". Адрес должен начинаться с http:// или https://`,
      showUsage: false,
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      kind: 'error',
      message: `Ошибка: поддерживаются только http:// и https://, получено "${parsed.protocol}"`,
      showUsage: false,
    };
  }

  return { kind: 'run', url };
}
