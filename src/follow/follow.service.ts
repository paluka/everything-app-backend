// src/follow/follow.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from './follow.entity';
import { UserEntity } from '../user/user.entity';

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
    const follower = await this.userRepository.findOneBy({ id: followerId });
    const following = await this.userRepository.findOneBy({ id: followingId });

    if (!follower || !following) {
      throw new Error('User not found');
    }

    const existingFollow = await this.followRepository.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
    });

    if (existingFollow) {
      throw new Error('You are already following this user');
    }

    const follow = this.followRepository.create({ follower, following });
    return this.followRepository.save(follow);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const result = await this.followRepository.delete({
      follower: { id: followerId },
      following: { id: followingId },
    });

    if (result.affected === 0) {
      throw new Error('You are not following this user');
    }
  }

  async getFollowers(userId: string): Promise<FollowEntity[]> {
    return this.followRepository.find({
      where: { following: { id: userId } },
      relations: ['follower'],
    });
  }

  async getFollowing(userId: string): Promise<FollowEntity[]> {
    return this.followRepository.find({
      where: { follower: { id: userId } },
      relations: ['following'],
    });
  }
}
