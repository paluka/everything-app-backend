import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { MessageEntity, MessageStatus } from './message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

const RABBITMQ_SERVICE = process.env.RABBITMQ_SERVICE || 'RABBITMQ_SERVICE';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @Inject(RABBITMQ_SERVICE)
    private rabbitmqClient: ClientProxy,
  ) {}

  // // Send the message to the RabbitMQ queue
  // async sendMessage(content: string, sender: string) {
  //   const message = { content, sender, timestamp: new Date() };
  //   await this.rabbitmqClient.emit(process.env.RABBITMQ_MESSAGE_QUEUE, message);
  // }

  // Emit message to a specific user based on userId
  // sendMessageToUser(userId: string, message: any) {
  //   const webSocketClient = this.webSocketClientsMap.get(userId);

  //   if (webSocketClient) {
  //     webSocketClient.emit('message', message); // Send message to this specific webSocket client
  //   } else {
  //     console.log(`User with id ${userId} not connected`);
  //   }
  // }

  // @MessagePattern(process.env.RABBITMQ_MESSAGE_QUEUE)
  // async handleMessageInRabbitMQ(@Payload() payload: WebSocketPayload) {
  //   console.log(
  //     `Received message in RabbitMQ queue named "${process.env.RABBITMQ_MESSAGE_QUEUE}":`,
  //     payload,
  //   );

  //   // After processing the message, emit it to the appropriate WebSocket client
  //   // this.server.emit('message', message); // Send message to the frontend via WebSocket

  //   const webSocketClient = this.webSocketClientsMap.get(payload.receiver);

  //   if (webSocketClient) {
  //     webSocketClient.emit('message', payload); // Send message to this specific webSocket client
  //   } else {
  //     console.log(
  //       `User with id ${payload.receiver} not connected to WebSockets`,
  //     );
  //   }
  // }

  async create(messageData: Partial<MessageEntity>): Promise<MessageEntity> {
    const message = this.messageRepository.create(messageData);
    return this.messageRepository.save(message);
  }

  async findByConversation(conversationId: string): Promise<MessageEntity[]> {
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
    });
  }

  async updateMessageStatus(
    id: string,
    status: MessageStatus,
  ): Promise<MessageEntity> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    message.status = status;
    return this.messageRepository.save(message);
  }
}
