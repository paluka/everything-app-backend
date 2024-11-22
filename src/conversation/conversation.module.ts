import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './conversation.entity';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { ParticipantEntity } from 'src/participant/participant.entity';
import { MessageEntity } from 'src/message/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ParticipantEntity,
      MessageEntity,
    ]),
  ],
  providers: [ConversationService],
  controllers: [ConversationController],
  // exports: [ConversationService], // Export if other modules need access
})
export class ConversationModule {}
