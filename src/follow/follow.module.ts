// src/follow/follow.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowEntity } from './follow.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { UserEntity } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowEntity, UserEntity])],
  providers: [FollowService],
  controllers: [FollowController],
})
export class FollowModule {}
