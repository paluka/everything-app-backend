// src/post/post.service.ts
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
// import RedisClient from 'ioredis';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '@paralleldrive/cuid2';

import { PostEntity } from './post.entity';
import { UserEntity } from '../user/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PostService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // this.redisClient = new RedisClient({ host: 'localhost', port: 6379 });
  }

  //   async getCachedPopularPosts() {
  //     const cachedData = await this.redisClient.get(this.CACHE_KEY);
  //     return JSON.parse(cachedData); // Ensure the data is in JSON format
  //   }

  async createPost(content: string, userId: string): Promise<PostEntity> {
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

  async findAll(): Promise<PostEntity[]> {
    console.log('GETTING ALL POSTS FROM ALL USERS');
    return this.postRepository.find({
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllPagination(
    limit: number,
    cursor?: string,
  ): Promise<{
    posts: PostEntity[];
    paginated: boolean;
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    console.log(
      `GETTING POSTS FROM ALL USERS USING PAGINATION. Limit ${limit}, Cursor: ${cursor}`,
    );
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('post.createdAt', 'DESC')
      .take(limit + 1); // Fetch one extra to determine if there's more

    if (cursor) {
      query.where('post.createdAt < :cursor', { cursor });
    }

    const posts = await query.getMany();

    const hasMore = posts.length > limit;
    const nextCursor = hasMore ? posts[limit - 1].createdAt.toString() : null;

    return {
      posts: posts.slice(0, limit), // Return only the requested number of posts
      paginated: true,
      nextCursor,
      hasMore,
    };
  }

  async findOne(id: string): Promise<PostEntity> {
    const post = await this.postRepository.findOne({
      where: { id },
      //   relations: ['user'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async updatePost(
    id: string,
    updates: Partial<PostEntity>,
  ): Promise<PostEntity> {
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
