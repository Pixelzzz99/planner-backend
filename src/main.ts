import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { getJwtSecret } from './common/config/jwt.config';
import helmet from 'helmet';

loadEnv({ path: resolve(process.cwd(), '.env') });

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (raw) {
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }
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
  await app.listen(port, '::', () => {
    console.log(`Server listening on [::]${port}`);
  });
}
bootstrap();
