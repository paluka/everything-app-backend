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

@Module({
  imports: [
    ConfigModule.forRoot({
      // Load .env file
      isGlobal: true,
    }),
    ClientsModule.register([
      // RabbitMQ message broker
      {
        name: process.env.RABBITMQ_MESSAGE_SERVICE,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: process.env.RABBITMQ_MESSAGE_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    TypeOrmModule.forFeature([MessageEntity, ParticipantEntity]),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway, ParticipantService],
  //exports: [MessageService], // Export if other modules need access
})
export class MessageModule {}
