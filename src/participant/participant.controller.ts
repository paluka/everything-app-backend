import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { ParticipantEntity } from './participant.entity';

@Controller('participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Post()
  async addParticipant(
    @Body() participantData: Partial<ParticipantEntity>,
  ): Promise<ParticipantEntity> {
    return this.participantService.addParticipant(participantData);
  }

  @Get(':conversationId')
  async findByConversation(
    @Param('conversationId') conversationId: string,
  ): Promise<ParticipantEntity[]> {
    return this.participantService.findByConversation(conversationId);
  }
}
