import { Test, TestingModule } from '@nestjs/testing';
import { BenchmarkService } from '../benchmark/benchmark.service';
import { BenchmarkResult } from '../benchmark/benchmark.types';
import { CLI_OUTPUT, CliOutput } from './cli.output';
import { USAGE } from './cli.parser';
import { CliService } from './cli.service';

describe('CliService', () => {
  let service: CliService;
  let benchmark: { run: jest.Mock<Promise<BenchmarkResult>, [string]> };
  let output: { log: jest.Mock; error: jest.Mock } & CliOutput;

  const result = (overrides: Partial<BenchmarkResult> = {}): BenchmarkResult => ({
    url: 'http://example.test/file.jpg',
    attempts: [
      {
        index: 0,
        ok: true,
        status: 200,
        bytes: 1000,
        durationMs: 100,
        error: null,
      },
    ],
    summary: {
      okCount: 1,
      failCount: 0,
      avgMs: 100,
      totalBytes: 1000,
      totalMs: 100,
      bytesPerSecond: 10_000,
    },
    ...overrides,
  });

  beforeEach(async () => {
    benchmark = { run: jest.fn() };
    output = { log: jest.fn(), error: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CliService,
        { provide: BenchmarkService, useValue: benchmark },
        { provide: CLI_OUTPUT, useValue: output },
      ],
    }).compile();

    service = moduleRef.get(CliService);
  });

  it('prints help and exits successfully for --help', async () => {
    await expect(service.run(['--help'])).resolves.toBe(0);
    expect(output.log).toHaveBeenCalledWith(USAGE);
    expect(benchmark.run).not.toHaveBeenCalled();
  });

  it('exits with code 1 and shows usage when no URL is given', async () => {
    await expect(service.run([])).resolves.toBe(1);
    expect(output.error).toHaveBeenCalledWith('Ошибка: не указан адрес.');
    expect(output.error).toHaveBeenCalledWith(`\n${USAGE}`);
    expect(benchmark.run).not.toHaveBeenCalled();
  });

  it('exits with code 1 for an invalid URL', async () => {
    await expect(service.run(['example.com/file.jpg'])).resolves.toBe(1);
    expect(output.error.mock.calls[0][0]).toContain('http');
    expect(benchmark.run).not.toHaveBeenCalled();
  });

  it('prints the report and exits with 0 on success', async () => {
    benchmark.run.mockResolvedValue(result());

    await expect(service.run(['http://example.test/file.jpg'])).resolves.toBe(
      0,
    );

    expect(benchmark.run).toHaveBeenCalledWith('http://example.test/file.jpg');
    expect(output.log.mock.calls[0][0]).toContain('Скорость скачивания');
    expect(output.error).not.toHaveBeenCalled();
  });

  it('exits with code 1 when every request failed', async () => {
    benchmark.run.mockResolvedValue(
      result({
        attempts: [
          {
            index: 0,
            ok: false,
            status: 500,
            bytes: 0,
            durationMs: 10,
            error: 'HTTP 500',
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
      }),
    );

    await expect(service.run(['http://example.test/broken'])).resolves.toBe(1);
  });

  it('warns on partial failures but exits with 0', async () => {
    benchmark.run.mockResolvedValue(
      result({
        summary: {
          okCount: 1,
          failCount: 1,
          avgMs: 100,
          totalBytes: 1000,
          totalMs: 100,
          bytesPerSecond: 10_000,
        },
      }),
    );

    await expect(service.run(['http://example.test/file.jpg'])).resolves.toBe(
      0,
    );
    expect(output.error).toHaveBeenCalledWith(
      expect.stringContaining('Предупреждение'),
    );
  });
});
