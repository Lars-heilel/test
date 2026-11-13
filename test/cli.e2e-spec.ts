import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { startTestServer } from '../test-support/test-server';

const mainPath = join(__dirname, '..', 'dist', 'main.js');

interface CliRun {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[]): Promise<CliRun> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [mainPath, ...args]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

describe('CLI (e2e)', () => {
  it('prints usage and exits with 1 without a URL', async () => {
    const { code, stderr } = await runCli([]);

    expect(code).toBe(1);
    expect(stderr).toContain('Использование');
  }, 20_000);

  it('downloads the URL 10 times and prints metrics', async () => {
    const payload = Buffer.alloc(1000, 'a');
    const server = await startTestServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      res.end(payload);
    });

    try {
      const { code, stdout } = await runCli([`${server.url}/file.bin`]);

      expect(code).toBe(0);
      expect(server.stats().requestCount).toBe(10);
      expect(stdout).toContain('Запросов: 10');
      expect(stdout).toContain('10.00 KB');
      expect(stdout).toContain('Скорость скачивания');
      expect(stdout).toMatch(/KB\/с/);
    } finally {
      await server.close();
    }
  }, 30_000);
});
