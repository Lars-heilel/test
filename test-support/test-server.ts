import http from 'node:http';

export interface TestServer {
  url: string;
  stats(): { requestCount: number; maxInFlight: number };
  close(): Promise<void>;
}

export async function startTestServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<TestServer> {
  let requestCount = 0;
  let inFlight = 0;
  let maxInFlight = 0;

  const server = http.createServer((req, res) => {
    requestCount++;
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    res.on('close', () => {
      inFlight--;
    });
    handler(req, res);
  });

  await new Promise<void>((resolve) =>
    server.listen(0, '127.0.0.1', resolve),
  );
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Не удалось определить порт тестового сервера');
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    stats: () => ({ requestCount, maxInFlight }),
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
