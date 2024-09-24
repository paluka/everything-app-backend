// src/user/user.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
// import RedisClient from 'ioredis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { Post } from '../post/post.entity';

@Injectable()
export class UserService {
  //   private redisClient: RedisClient;
  private ALL_USERS_CACHE_KEY = 'ALL_USERS';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // this.redisClient = new RedisClient({ host: 'localhost', port: 6379 });
  }

  //   async getCachedPopularPosts() {
  //     const cachedData = await this.redisClient.get(this.CACHE_KEY);
  //     return JSON.parse(cachedData); // Ensure the data is in JSON format
  //   }

  async createUser(name: string, email: string, image?: string): Promise<User> {
    const newUser = this.userRepository.create({ name, email, image });
    return this.userRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    console.log('FINDING ALL USERS');

    try {
      const cachedUsers = await this.cacheManager.get(this.ALL_USERS_CACHE_KEY);

      if (cachedUsers) {
        console.log('RETURNING CACHED FINDING ALL USERS');
        return cachedUsers as User[]; // Return cached posts if available
      }

      // If not cached, fetch from DB
      const users = await this.userRepository.find({ relations: ['posts'] });
      await this.cacheManager.set(
        this.ALL_USERS_CACHE_KEY,
        users,
        parseInt(process.env.REDIS_TTL),
      );
      console.log('RETURNING NON-CACHED ALL USERS');
      return users;
    } catch (e) {
      console.log('ERROR IN USER SERVICE FINDING ALL USERS', e);
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

  async findOne(id: string): Promise<User> {
    console.log('FINDING ONE USER', id);
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['posts'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
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
