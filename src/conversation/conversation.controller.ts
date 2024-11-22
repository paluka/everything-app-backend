import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationEntity } from './conversation.entity';
import { CreateConversationDto } from './conversation.dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationEntity> {
    return this.conversationService.createConversation(createConversationDto);
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
