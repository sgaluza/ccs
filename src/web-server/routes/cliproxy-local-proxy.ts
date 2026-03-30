/**
 * CLIProxy Local Reverse Proxy
 *
 * Proxies requests from the dashboard to the local CLIProxy service
 * running on 127.0.0.1:8317 inside the same host/container.
 *
 * This eliminates cross-origin issues when the dashboard and CLIProxy
 * run on different ports (e.g., inside Docker containers where the
 * browser cannot reach the internal CLIProxy port directly).
 *
 * Mounted at: /cliproxy-local/*  →  http://127.0.0.1:{port}/*
 */

import { Router, Request, Response } from 'express';
import http from 'http';
import { CLIPROXY_DEFAULT_PORT } from '../../cliproxy/config/port-manager';

const router = Router();

router.all('/*', (req: Request, res: Response) => {
  // Strip the mount prefix — req.url already has it removed by Express
  const targetPath = req.url || '/';

  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: CLIPROXY_DEFAULT_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${CLIPROXY_DEFAULT_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'CLIProxy is not reachable' });
    }
  });

  req.pipe(proxyReq, { end: true });
});

export default router;
