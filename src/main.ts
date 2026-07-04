import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { getJwtSecret } from './common/config/jwt.config';
import helmet from 'helmet';

loadEnv({ path: resolve(process.cwd(), '.env') });

function getAllowedOrigins(): string[] {
  const fromList = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const origins = new Set(fromList);
  if (frontendUrl) origins.add(frontendUrl);

  if (origins.size > 0) return [...origins];

  return ['http://localhost:3001', 'http://localhost:3000'];
}

async function bootstrap() {
  getJwtSecret();
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT || 3000;
  const allowedOrigins = getAllowedOrigins();
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  await app.listen(port, '::', () => {
    console.log(`Server listening on [::]${port}`);
  });
}
bootstrap();
