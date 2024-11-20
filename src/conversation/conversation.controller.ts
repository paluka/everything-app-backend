import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationEntity } from './conversation.entity';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async create(
    @Body() conversationData: Partial<ConversationEntity>,
  ): Promise<ConversationEntity> {
    return this.conversationService.create(conversationData);
  }

  @Get()
  async findAll(): Promise<ConversationEntity[]> {
    return this.conversationService.findAll();
  }

  @Get('user/:userId')
  async getAllConversationsByUser(
    @Param('userId') userId: string,
  ): Promise<ConversationEntity[]> {
    return this.conversationService.getAllConversationsByUser(userId);
  }

  @Get('check/:userAId/:userBId')
  async getConversationBetweenUsers(
    @Param('userAId') userAId: string,
    @Param('userBId') userBId: string,
  ): Promise<ConversationEntity | null> {
    return this.conversationService.getConversationBetweenUsers(
      userAId,
      userBId,
    );
  }
}
