import { ValidationPipe } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
app.enableCors({
  origin: true,
  credentials: true,
});

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      transform: true,

      forbidNonWhitelisted: true,
    }),
  );

  // Global API Prefix
  app.setGlobalPrefix('api');

  const PORT = process.env.PORT || 5000;

  await app.listen(PORT);

  console.log(`🚀 Server running on port ${PORT}`);
}

bootstrap();
