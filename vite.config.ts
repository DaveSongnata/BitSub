import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/**
 * Serve the Vercel functions in /api during `vite dev` and `vite preview`,
 * so local development behaves exactly like production.
 */
function vercelApiDev(): Plugin {
  const handle =
    (server: Pick<ViteDevServer, 'ssrLoadModule'> | null) =>
    async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const match = /^\/api\/([a-z-]+)$/.exec(url.pathname);
      if (!match || !server) return next();
      try {
        const mod = (await server.ssrLoadModule(`/api/${match[1]}.ts`)) as Record<
          string,
          ((r: Request) => Promise<Response>) | undefined
        >;
        const fn = mod[req.method ?? 'GET'];
        if (!fn) {
          res.statusCode = 405;
          return res.end();
        }
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers.set(k, v);
        }
        const origin = `http://${req.headers.host ?? 'localhost'}`;
        const response = await fn(new Request(new URL(req.url ?? '/', origin), { method: req.method, headers }));
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end('dev api error');
      }
    };
  return {
    name: 'bitsub-vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(handle(server));
    },
    async configurePreviewServer(server) {
      // Preview has no ssrLoadModule; spin up a tiny Vite server just to load /api modules.
      const { createServer } = await import('vite');
      const loader = await createServer({
        configFile: false,
        server: { middlewareMode: true, hmr: false },
        appType: 'custom',
      });
      server.middlewares.use(handle(loader));
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    vercelApiDev(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: false, // hand-written public/manifest.webmanifest
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  server: { port: 3000 },
  preview: { port: 4173 },
});
