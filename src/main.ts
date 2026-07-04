import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { getJwtSecret } from './common/config/jwt.config';
import helmet from 'helmet';

loadEnv({ path: resolve(process.cwd(), '.env') });

function getExplicitOrigins(): string[] {
  const fromList = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const origins = new Set(fromList);
  if (frontendUrl) origins.add(frontendUrl);

  return [...origins];
}

function isOriginAllowed(origin: string, explicit: string[]): boolean {
  if (explicit.includes(origin)) return true;

  return explicit.some((entry) => {
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(1);
      try {
        const { hostname } = new URL(origin);
        return hostname.endsWith(suffix);
      } catch {
        return false;
      }
    }
    return false;
  });
}

function createCorsOriginChecker() {
  const explicit = getExplicitOrigins();
  const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT);
  const railwayFallback = onRailway && explicit.length === 0;

  if (explicit.length > 0) {
    console.log(`CORS explicit origins: ${explicit.join(', ')}`);
  } else if (railwayFallback) {
    console.log('CORS: Railway fallback enabled (*.up.railway.app)');
  } else {
    console.log('CORS: localhost dev origins');
  }

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (explicit.length > 0 && isOriginAllowed(origin, explicit)) {
      callback(null, true);
      return;
    }

    if (railwayFallback) {
      try {
        const { hostname } = new URL(origin);
        if (hostname.endsWith('.up.railway.app')) {
          callback(null, true);
          return;
        }
      } catch {
        // invalid origin URL
      }
    }

    if (explicit.length === 0 && !railwayFallback) {
      const devOrigins = ['http://localhost:3001', 'http://localhost:3000'];
      if (devOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(null, false);
  };
}

async function bootstrap() {
  getJwtSecret();
  const app = await NestFactory.create(AppModule);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: createCorsOriginChecker(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT || 3000;
  await app.listen(port, '::', () => {
    console.log(`Server listening on [::]${port}`);
  });
}
bootstrap();
