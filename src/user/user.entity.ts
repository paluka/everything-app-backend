// src/user/user.entity.ts
import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { createId } from '@paralleldrive/cuid2';

import { PostEntity } from '../post/post.entity';
import { MessageEntity } from 'src/message/message.entity';
import { ParticipantEntity } from 'src/participant/participant.entity';
import { FollowEntity } from '../follow/follow.entity';

@Entity('User')
export class UserEntity {
  @PrimaryColumn('varchar', { length: 25 })
  id: string = createId();

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerified?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image?: string;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];

  @OneToMany(() => ParticipantEntity, (participant) => participant.user)
  participants: ParticipantEntity[];

  @OneToMany(() => MessageEntity, (message) => message.sender)
  messages: MessageEntity[];

  // Followers (users following this user)
  @OneToMany(() => FollowEntity, (follow) => follow.following)
  followers: FollowEntity[];

  // Following (users this user is following)
  @OneToMany(() => FollowEntity, (follow) => follow.follower)
  following: FollowEntity[];
}
