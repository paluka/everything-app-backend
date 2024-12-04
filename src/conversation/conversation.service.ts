import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from './conversation.entity';
import { MessageEntity } from 'src/message/message.entity';
import { ParticipantEntity } from 'src/participant/participant.entity';
import { CreateConversationDto } from './conversation.dto';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ParticipantEntity)
    private readonly participantRepository: Repository<ParticipantEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}

  // Example methods for CRUD operations
  async createConversation(
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationEntity> {
    console.log('Here is my create conversation dto', {
      createConversationDto,
    });
    const conversation = this.conversationRepository.create({});
    // return this.conversationRepository.save(conversation);

    // Step 2: Save the conversation
    await this.conversationRepository.save(conversation);

    console.log('Saved the new conversation');
    // Step 3: Add participants to the conversation
    const participants = createConversationDto.participants.map(
      (participantData) => {
        const participant = this.participantRepository.create({
          user: { id: participantData.userId } as UserEntity,
          conversation: { id: conversation.id } as ConversationEntity,
        });
        return participant;
      },
    );
    await this.participantRepository.save(participants);

    // Step 4: Add the first message to the conversation
    let message = null;

    if (createConversationDto.messages.length) {
      message = this.messageRepository.create({
        content: createConversationDto.messages[0].content,
        sender: { id: createConversationDto.messages[0].senderId },
        conversation: { id: conversation.id },
      });
      await this.messageRepository.save(message);
    }

    // Step 5: Return the created conversation (you can include participants and messages if needed)
    return {
      ...conversation,
      participants,
      messages: message ? [message] : [],
    };
  }

  async findAll(): Promise<ConversationEntity[]> {
    return this.conversationRepository.find();
  }

  async getAllConversationsByUser(
    userId: string,
  ): Promise<ConversationEntity[]> {
    console.log('getAllConversationsByUser', userId);
    // const conversations = await this.conversationRepository.find({
    //   relations: ['participants', 'participants.user'],
    //   where: {
    //     participants: {
    //       user: {
    //         id: userId,
    //       },
    //     },
    //   },
    // });

    // const conversations = await this.conversationRepository
    //   .createQueryBuilder('conversation')
    //   .leftJoinAndSelect('conversation.participants', 'participants')
    //   .leftJoinAndSelect('participants.user', 'user')
    //   .where((qb) => {
    //     const subQuery = qb
    //       .subQuery()
    //       .select('conversation2.id')
    //       .from(ConversationEntity, 'conversation2')
    //       .leftJoin('conversation2.participants', 'participants2')
    //       .where('participants2.user.id = :userId')
    //       .getQuery();
    //     return 'conversation.id IN ' + subQuery;
    //   })
    //   .setParameter('userId', userId)
    //   .getMany();

    // return this.conversationRepository
    //   .createQueryBuilder('conversation')
    //   .leftJoinAndSelect('conversation.participants', 'participants')
    //   .leftJoinAndSelect('participants.user', 'user')
    //   .whereExists(
    //     qb =>
    //       qb
    //         .select('1')
    //         .from('participant', 'p')
    //         .where('p.conversationId = conversation.id')
    //         .andWhere('p.userId = :userId'),
    //     { userId }
    //   )
    //   .getMany();

    const conversations = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .leftJoinAndSelect('conversation.messages', 'messages') // Add messages relation
      .leftJoinAndSelect('messages.sender', 'sender') // Optionally include message sender
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('conversation2.id')
          .from(ConversationEntity, 'conversation2')
          .leftJoin('conversation2.participants', 'participants2')
          .where('participants2.user.id = :userId')
          .getQuery();
        return 'conversation.id IN ' + subQuery;
      })
      .setParameter('userId', userId)
      .orderBy('messages.createdAt', 'ASC') // Optional: order messages by date
      .getMany();

    console.log(JSON.stringify(conversations, null, 2)); // Debug log
    return conversations;
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
