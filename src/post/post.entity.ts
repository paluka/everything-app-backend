// src/post/post.entity.ts
import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { createId } from '@paralleldrive/cuid2';

import { UserEntity } from '../user/user.entity';

@Entity('Post')
export class PostEntity {
  @PrimaryColumn('varchar', { length: 25 })
  id: string = createId();

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  user: UserEntity;
}
