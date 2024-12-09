// src/user/user.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
// import RedisClient from 'ioredis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';
import { PostEntity } from '../post/post.entity';
import logger from 'src/utils/logger';

@Injectable()
export class UserService {
  //   private redisClient: RedisClient;
  public ALL_USERS_CACHE_KEY = 'ALL_USERS';

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // this.redisClient = new RedisClient({ host: 'localhost', port: 6379 });
  }

  //   async getCachedPopularPosts() {
  //     const cachedData = await this.redisClient.get(this.CACHE_KEY);
  //     return JSON.parse(cachedData); // Ensure the data is in JSON format
  //   }

  async createUser(
    name: string,
    email: string,
    image?: string,
  ): Promise<UserEntity> {
    const newUser = this.userRepository.create({ name, email, image });
    return this.userRepository.save(newUser);
  }

  async findAll(): Promise<UserEntity[]> {
    console.log('FINDING ALL USERS');

    try {
      const cachedUsers = await this.cacheManager.get(this.ALL_USERS_CACHE_KEY);

      if (cachedUsers) {
        console.log('RETURNING CACHED FINDING ALL USERS');
        return cachedUsers as UserEntity[]; // Return cached posts if available
      }

      // If not cached, fetch from DB
      const users = await this.userRepository.find({
        relations: ['posts', 'followers', 'following'],
      });

      users.forEach((user) => {
        user.posts.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      });

      await this.cacheManager.set(
        this.ALL_USERS_CACHE_KEY,
        users,
        parseInt(process.env.REDIS_TTL),
      );
      console.log('RETURNING NON-CACHED ALL USERS');
      return users;
    } catch (error: unknown) {
      logger.error('ERROR IN USER SERVICE FINDING ALL USERS', error);
    }

    // console.log('findAll');
    // const users = await this.userRepository.find();

    // if (users.length === 0) {
    //   console.log('No users found');
    // } else {
    //   console.log(`Found ${users.length} users`);
    // }
    // return users;
  }

  async findOne(id: string): Promise<UserEntity> {
    try {
      logger.log('FINDING ONE USER', id);
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['posts', 'followers.follower', 'following.following'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      user.posts.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      logger.log(`FOUND USER with id ${id}`);
      return user;
    } catch (error: unknown) {
      logger.error(`Error in user service in findOne():`, error);
    }
  }

  async updateUser(
    id: string,
    updates: Partial<UserEntity>,
  ): Promise<UserEntity> {
    await this.userRepository.update(id, updates);
    await this.cacheManager.del(this.ALL_USERS_CACHE_KEY);
    return this.findOne(id);
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    } else {
      await this.cacheManager.del(this.ALL_USERS_CACHE_KEY);
    }
  }
}
