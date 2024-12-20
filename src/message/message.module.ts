import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';

import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageEntity } from './message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageGateway } from './message.gateway';
import { ParticipantService } from 'src/participant/participant.service';
import { ParticipantEntity } from 'src/participant/participant.entity';
import {
  RABBITMQ_MESSAGE_QUEUE,
  RABBITMQ_SERVICE,
  RABBITMQ_URL,
} from 'src/contants';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Load .env file
      isGlobal: true,
    }),
    ClientsModule.register([
      // RabbitMQ message broker
      {
        name: RABBITMQ_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || RABBITMQ_URL],
          queue: process.env.RABBITMQ_MESSAGE_QUEUE || RABBITMQ_MESSAGE_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    TypeOrmModule.forFeature([MessageEntity, ParticipantEntity]),
  ],
  controllers: [MessageController],
  providers: [MessageGateway, MessageService, ParticipantService],
  exports: [MessageService], // Export if other modules need access
})
export class MessageModule {}
