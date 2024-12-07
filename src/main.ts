import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RABBITMQ_MESSAGE_QUEUE, RABBITMQ_URL } from './contants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || RABBITMQ_URL],
      queue: process.env.RABBITMQ_MESSAGE_QUEUE || RABBITMQ_MESSAGE_QUEUE,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3010; // Read from environment variable or default to 3010
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Database URL: ${process.env.DATABASE_URL}`);
}
bootstrap();
