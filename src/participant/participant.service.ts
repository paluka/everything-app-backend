import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantEntity } from './participant.entity';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(ParticipantEntity)
    private readonly participantRepository: Repository<ParticipantEntity>,
  ) {}

  async addParticipant(
    participantData: Partial<ParticipantEntity>,
  ): Promise<ParticipantEntity> {
    const participant = this.participantRepository.create(participantData);
    return this.participantRepository.save(participant);
  }

  async findByConversation(
    conversationId: string,
  ): Promise<ParticipantEntity[]> {
    return this.participantRepository.find({
      where: { conversation: { id: conversationId } },
    });
  }
}
