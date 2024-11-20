import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationEntity } from '../conversation/conversation.entity';
import { UserEntity } from '../user/user.entity';
import { createId } from '@paralleldrive/cuid2';

@Entity('Participants')
export class ParticipantEntity {
  @PrimaryColumn('varchar', { length: 25 })
  id: string = createId();

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @ManyToOne(
    () => ConversationEntity,
    (conversation) => conversation.participants,
  )
  conversation: ConversationEntity;

  @ManyToOne(() => UserEntity, (user) => user.participants)
  user: UserEntity;
}
