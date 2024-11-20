import {
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ParticipantEntity } from '../participant/participant.entity';
import { MessageEntity } from '../message/message.entity';
import { createId } from '@paralleldrive/cuid2';

@Entity('Conversation')
export class ConversationEntity {
  @PrimaryColumn('varchar', { length: 25 })
  id: string = createId();

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  //   @Column({ nullable: true })
  //   name: string;

  //   @Column({ default: false })
  //   isGroup: boolean;

  @OneToMany(() => ParticipantEntity, (participant) => participant.conversation)
  participants: ParticipantEntity[];

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];
}
