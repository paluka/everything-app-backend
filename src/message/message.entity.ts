import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationEntity } from '../conversation/conversation.entity';
import { UserEntity } from '../user/user.entity';
import { createId } from '@paralleldrive/cuid2';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('Message')
export class MessageEntity {
  @PrimaryColumn('varchar', { length: 25 })
  id: string = createId();

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  conversation: ConversationEntity;

  @Column()
  conversationId: string;

  @ManyToOne(() => UserEntity, (user) => user.messages)
  sender: UserEntity;

  @Column()
  senderId: string;

  @Column()
  content: string;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status: MessageStatus;
}
