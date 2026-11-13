import { Test, TestingModule } from '@nestjs/testing';
import { BenchmarkModule } from './benchmark.module';
import { BenchmarkService } from './benchmark.service';
import { startTestServer, TestServer } from '../../test-support/test-server';

describe('BenchmarkService', () => {
  let moduleRef: TestingModule;
  let service: BenchmarkService;
  const servers: TestServer[] = [];

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [BenchmarkModule],
    }).compile();
    service = moduleRef.get(BenchmarkService);
  });

  afterEach(async () => {
    await moduleRef.close();
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  async function serve(
    handler: Parameters<typeof startTestServer>[0],
  ): Promise<TestServer> {
    const server = await startTestServer(handler);
    servers.push(server);
    return server;
  }

  it('performs 10 sequential requests and totals bytes', async () => {
    const payload = Buffer.alloc(2048, 'a');
    const server = await serve((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      setTimeout(() => res.end(payload), 5);
    });

    const result = await service.run(`${server.url}/file.bin`);

    expect(server.stats().requestCount).toBe(10);
    expect(server.stats().maxInFlight).toBe(1);
    expect(result.attempts).toHaveLength(10);
    expect(result.summary.okCount).toBe(10);
    expect(result.summary.totalBytes).toBe(10 * payload.length);
    expect(result.summary.avgMs).toBeGreaterThan(0);
    expect(result.summary.bytesPerSecond).toBeGreaterThan(0);
  });

  it('marks HTTP errors as failed attempts', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('server error');
    });

    const result = await service.run(`${server.url}/broken`, { count: 2 });

    expect(server.stats().requestCount).toBe(2);
    expect(result.summary.okCount).toBe(0);
    expect(result.summary.failCount).toBe(2);
    expect(result.attempts[0].error).toContain('500');
    expect(result.summary.bytesPerSecond).toBeNull();
  });

  it('handles empty responses without division by zero', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end();
    });

    const result = await service.run(`${server.url}/empty`, { count: 3 });

    expect(result.summary.okCount).toBe(3);
    expect(result.summary.totalBytes).toBe(0);
    expect(result.summary.bytesPerSecond).toBeNull();
  });

  it('reports network errors instead of throwing', async () => {
    const server = await serve((_req, res) => res.end('ok'));
    const deadUrl = server.url;
    await server.close();
    servers.splice(servers.indexOf(server), 1);

    const result = await service.run(`${deadUrl}/gone`, { count: 2 });

    expect(result.summary.okCount).toBe(0);
    expect(result.summary.failCount).toBe(2);
    expect(result.attempts[0].error).toBeTruthy();
    expect(result.summary.bytesPerSecond).toBeNull();
  });

  it('fails an attempt on timeout', async () => {
    const server = await serve(() => {
      // never respond
    });

    const result = await service.run(`${server.url}/slow`, {
      count: 1,
      timeoutMs: 50,
    });

    expect(result.summary.okCount).toBe(0);
    expect(result.attempts[0].error).toContain('таймаут');
  });
});
