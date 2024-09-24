// src/post/post.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
// import RedisClient from 'ioredis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '@paralleldrive/cuid2';

import { Post } from './post.entity';
import { User } from '../user/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PostService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // this.redisClient = new RedisClient({ host: 'localhost', port: 6379 });
  }

  //   async getCachedPopularPosts() {
  //     const cachedData = await this.redisClient.get(this.CACHE_KEY);
  //     return JSON.parse(cachedData); // Ensure the data is in JSON format
  //   }

  async createPost(content: string, userId: string): Promise<Post> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const newPost = this.postRepository.create({
      id: createId(),
      content,
      userId,
    });
    console.log('NEW POST CREATED', newPost);
    await this.cacheManager.del(this.userService.ALL_USERS_CACHE_KEY);

    return this.postRepository.save(newPost);
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      //   relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      //   relations: ['user'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    await this.postRepository.update(id, updates);
    return this.findOne(id);
  }

  async deletePost(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }
}
