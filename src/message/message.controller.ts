import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageEntity } from './message.entity';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

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
}
