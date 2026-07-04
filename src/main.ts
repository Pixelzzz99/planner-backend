import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { getJwtSecret } from './common/config/jwt.config';

async function bootstrap() {
  getJwtSecret();
  const app = await NestFactory.create(AppModule, { cors: true });
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
