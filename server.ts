// ====================================================================
// FoodS — Servidor Backend Principal Node.js / Express
// ====================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiGateway } from './apps/api-gateway/index.js';
import { logger } from './packages/shared/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Desativar identificação do Express
  app.disable('x-powered-by');

  // Middleware Militar de Segurança no nível Express
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=(), payment=(self)');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Montar API Gateway sob prefixo /api
  app.use('/api', apiGateway);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    logger.info('Iniciando servidor Vite Express Middleware em desenvolvimento...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    logger.info('Iniciando servidor em modo PRODUÇÃO...');
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 FoodS SaaS Server rodando com sucesso na porta ${PORT}`);
    logger.info(`📍 Desenvolvimento URL: http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error('Erro ao iniciar o servidor FoodS:', err);
  process.exit(1);
});
