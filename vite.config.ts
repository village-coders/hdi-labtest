import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'net';

// Custom logger to suppress noisy ECONNREFUSED terminal error dumps while backend is starting
const logger = createLogger();
const originalError = logger.error.bind(logger);
logger.error = (msg, options) => {
  if (
    typeof msg === 'string' &&
    (msg.includes('ECONNREFUSED') || msg.includes('http proxy error'))
  ) {
    // Suppress raw proxy connection refused dumps during server boot
    return;
  }
  originalError(msg, options);
};

const BACKEND_PORT = 5000;
const BACKEND_HOST = '127.0.0.1';

// Non-blocking socket probe to check if backend is accepting connections
const isBackendListening = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(350);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(BACKEND_PORT, BACKEND_HOST);
  });
};

// Wait for backend during dev server startup (up to maxWaitMs)
const waitForBackend = async (maxWaitMs = 6000, pollIntervalMs = 250): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (await isBackendListening()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return false;
};

// Proxy bypass middleware: waits for backend to be ready instead of immediately throwing ECONNREFUSED
const createProxyBypass = () => {
  return async (_req: any, res: any) => {
    let ready = await isBackendListening();
    if (!ready) {
      // Backend is starting up, wait up to 6s
      ready = await waitForBackend(6000, 250);
    }

    if (ready) {
      // Return void so Vite proxies normally
      return;
    }

    // Backend not ready after timeout: send clean 503 and return false to bypass proxy.web()
    if (res && !res.headersSent) {
      res.writeHead(503, {
        'Content-Type': 'application/json',
        'Retry-After': '2',
      });
      res.end(
        JSON.stringify({
          message: 'Backend server is starting up on port 5000. Please wait a few moments and retry.',
          status: 503,
        })
      );
    }
    return false;
  };
};

export default defineConfig({
  customLogger: logger,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
        bypass: createProxyBypass(),
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  message: 'Backend server is temporarily reconnecting. Please retry momentarily.',
                  status: 503,
                })
              );
            }
          });
        },
      },
      '/uploads': {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
        bypass: createProxyBypass(),
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  message: 'Backend server is temporarily reconnecting.',
                  status: 503,
                })
              );
            }
          });
        },
      },
    },
  },
});
