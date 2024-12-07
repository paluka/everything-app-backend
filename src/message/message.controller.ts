import { Controller, Post, Get, Body, Param, Inject } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageEntity } from './message.entity';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RABBITMQ_MESSAGE_QUEUE } from 'src/contants';
import { MessageGateway } from './message.gateway';

@Controller('messages')
export class MessageController {
  constructor(
    @Inject(MessageService) private readonly messageService: MessageService,
    @Inject(MessageGateway) private readonly messageGateway: MessageGateway,
  ) {}

  @Post()
  async create(
    @Body() messageData: Partial<MessageEntity>,
  ): Promise<MessageEntity> {
    return this.messageService.create(messageData);
  }

  @Get(':conversationId')
  async findByConversation(
    @Param('conversationId') conversationId: string,
  ): Promise<MessageEntity[]> {
    return this.messageService.findByConversation(conversationId);
  }

  @EventPattern(RABBITMQ_MESSAGE_QUEUE)
  handleMessageInRabbitMQ(@Payload() message: Partial<MessageEntity>) {
    try {
      console.log(
        `Received message from RabbitMQ queue '${RABBITMQ_MESSAGE_QUEUE}'`,
        message,
      );

      this.messageGateway.handleMessageFromRabbitMQ(message);
    } catch (error: unknown) {
      console.error(
        'Error in sending WebSocket message:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
