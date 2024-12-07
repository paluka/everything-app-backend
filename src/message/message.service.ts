import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { MessageEntity, MessageStatus } from './message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageGateway } from './message.gateway';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @Inject(forwardRef(() => MessageGateway))
    private readonly messageGateway: MessageGateway,
  ) {}

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
