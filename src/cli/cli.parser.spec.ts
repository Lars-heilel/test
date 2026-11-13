import { parseCliArgs } from './cli.parser';

describe('parseCliArgs', () => {
  it('returns help for -h and --help', () => {
    expect(parseCliArgs(['-h'])).toEqual({ kind: 'help' });
    expect(parseCliArgs(['--help'])).toEqual({ kind: 'help' });
  });

  it('returns an error with usage when no URL is given', () => {
    expect(parseCliArgs([])).toEqual({
      kind: 'error',
      message: 'Ошибка: не указан адрес.',
      showUsage: true,
    });
  });

  it('rejects URLs without http(s) scheme', () => {
    const result = parseCliArgs(['example.com/file.jpg']);

    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(result.message).toContain('http');
      expect(result.showUsage).toBe(false);
    }
  });

  it('rejects non-http protocols', () => {
    const result = parseCliArgs(['ftp://example.com/file.jpg']);

    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(result.message).toContain('ftp:');
    }
  });

  it('accepts http and https URLs', () => {
    expect(parseCliArgs(['https://example.com/a.jpg'])).toEqual({
      kind: 'run',
      url: 'https://example.com/a.jpg',
    });
    expect(parseCliArgs(['http://127.0.0.1:8080/a'])).toEqual({
      kind: 'run',
      url: 'http://127.0.0.1:8080/a',
    });
  });
});
