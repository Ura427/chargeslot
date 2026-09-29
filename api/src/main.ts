import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    // The refresh token travels in an httpOnly cookie, so the web app sends credentials.
    credentials: true,
  });
  // Lets Prisma close its connection pool when Docker stops the container.
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
