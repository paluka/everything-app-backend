// src/follow/follow.controller.ts
import { Controller, Post, Delete, Param, Get, Body } from '@nestjs/common';
import { FollowService } from './follow.service';
import logger from 'src/utils/logger';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  async followUser(
    @Body() followData: { followerId: string; followingId: string },
  ) {
    logger.log(`Follow user data in controller:`, followData);

    return this.followService.followUser(
      followData.followerId,
      followData.followingId,
    );
  }

  @Delete(':followerId/:followingId')
  async unfollowUser(
    @Param('followerId') followerId: string,
    @Param('followingId') followingId: string,
  ) {
    return this.followService.unfollowUser(followerId, followingId);
  }

  @Get(':userId/followers')
  async getFollowers(@Param('userId') userId: string) {
    return this.followService.getFollowers(userId);
  }

  @Get(':userId/following')
  async getFollowing(@Param('userId') userId: string) {
    return this.followService.getFollowing(userId);
  }
}
