// src/follow/entities/follow.entity.ts
import { createId } from '@paralleldrive/cuid2';
import { Entity, ManyToOne, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('Follow')
export class FollowEntity {
  @PrimaryColumn('varchar', { length: 25 })
  id: string = createId();

  // The user who follows
  @ManyToOne(() => UserEntity, (user) => user.following, {
    onDelete: 'CASCADE',
  })
  follower: UserEntity;

  // The user being followed
  @ManyToOne(() => UserEntity, (user) => user.followers, {
    onDelete: 'CASCADE',
  })
  following: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
