// src/follow/follow.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from './follow.entity';
import { UserEntity } from '../user/user.entity';
import logger from 'src/utils/logger';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async followUser(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity> {
    try {
      logger.log(
        `Follow service: user ${followerId} is attempting to follow user ${followingId}`,
      );

      const follower = await this.userRepository.findOneBy({ id: followerId });
      const following = await this.userRepository.findOneBy({
        id: followingId,
      });

      if (!follower || !following) {
        throw new Error(
          `One of the users cannot be found when user ${followerId} attempts to follow user ${followingId}`,
        );
      }

      const existingFollow = await this.followRepository.findOne({
        where: { follower: { id: followerId }, following: { id: followingId } },
      });

      if (existingFollow) {
        throw new Error(
          `You are already following this user with id ${followingId}`,
        );
      }

      const follow = this.followRepository.create({ follower, following });
      return this.followRepository.save(follow);
    } catch (error: unknown) {
      logger.error(
        `Error in follow service when trying to follower user`,
        error,
      );
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      logger.log(
        `Follow service: user ${followerId} is unfollowing user ${followingId}`,
      );

      const result = await this.followRepository.delete({
        follower: { id: followerId },
        following: { id: followingId },
      });

      if (result.affected === 0) {
        throw new Error(
          `User ${followerId} not following this user with id ${followingId}`,
        );
      }
    } catch (error: unknown) {
      logger.error(
        `Error in follow service when trying to unfollower user`,
        error,
      );
    }
  }

  async getFollowers(userId: string): Promise<FollowEntity[]> {
    try {
      return this.followRepository.find({
        where: { following: { id: userId } },
        relations: ['follower'],
      });
    } catch (error: unknown) {
      logger.error(
        `Error in follow service when trying to get followers`,
        error,
      );
    }
  }

  async getFollowing(userId: string): Promise<FollowEntity[]> {
    try {
      return this.followRepository.find({
        where: { follower: { id: userId } },
        relations: ['following'],
      });
    } catch (error: unknown) {
      logger.error(
        `Error in follow service when trying to get following`,
        error,
      );
    }
  }
}
