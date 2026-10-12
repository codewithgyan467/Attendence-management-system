import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module.js';

if (typeof process.loadEnvFile === 'function') {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'backend/api/.env'),
    resolve(currentDir, '../.env'),
    resolve(currentDir, '../../.env'),
  ];
  for (const p of candidatePaths) {
    if (existsSync(p)) {
      try {
        process.loadEnvFile(p);
        break;
      } catch {}
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
await bootstrap();
