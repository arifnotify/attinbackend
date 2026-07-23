import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express'; // 🎯 এটি ইমপোর্ট করতে হবে

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🎯 পেমেন্ট গেটওয়ের (SSLCommerz) URL-encoded ডেটা রিড করার জন্য এগুলো বাধ্যতামূলক
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  const PORT = process.env.PORT || 5000;

  await app.listen(PORT);

  console.log(`🚀 Server running on port ${PORT}`);
}

bootstrap();