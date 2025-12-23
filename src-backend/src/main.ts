import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with permissive defaults; can be tightened via env/config
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Ensure all responses include common CORS headers (fallback for proxies)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    return next();
  });

  console.log(`Server is running on http://localhost:${process.env.PORT ?? 3000}`);
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
