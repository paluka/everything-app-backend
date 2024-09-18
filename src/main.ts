import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  const port = process.env.PORT || 3010; // Read from environment variable or default to 3000
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Database URL: ${process.env.DATABASE_URL}`);
}
bootstrap();
