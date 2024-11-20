import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './conversation.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
  ) {}

  // Example methods for CRUD operations
  async create(
    conversationData: Partial<ConversationEntity>,
  ): Promise<ConversationEntity> {
    const conversation = this.conversationRepository.create(conversationData);
    return this.conversationRepository.save(conversation);
  }

  async findAll(): Promise<ConversationEntity[]> {
    return this.conversationRepository.find();
  }

  async getAllConversationsByUser(
    userId: string,
  ): Promise<ConversationEntity[]> {
    return this.conversationRepository.find({
      relations: ['participants', 'participants.user'],
      where: {
        participants: {
          user: {
            id: userId,
          },
        },
      },
    });
  }

  async getConversationBetweenUsers(
    userAId: string,
    userBId: string,
  ): Promise<ConversationEntity | null> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoinAndSelect('conversation.participants', 'participantA')
      .innerJoinAndSelect('conversation.participants', 'participantB')
      .where('participantA.user.id = :userAId', { userAId })
      .andWhere('participantB.user.id = :userBId', { userBId })
      .getOne();
  }
}
