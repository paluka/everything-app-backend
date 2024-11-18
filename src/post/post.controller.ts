// src/post/post.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PostEntity } from './post.entity';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async createPost(
    @Body() createPostDto: { content: string; userId: string },
  ): Promise<PostEntity> {
    console.log('createPostDto', createPostDto);
    const { content, userId } = createPostDto;
    return this.postService.createPost(content, userId);
  }

  // @Get()
  // async findAll(): Promise<PostEntity[]> {
  //   return this.postService.findAll();
  // }

  @Get()
  async findAll(
    @Query('paginated') paginated?: boolean,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ): Promise<{
    posts: PostEntity[];
    paginated: boolean;
    nextCursor?: string | null;
    hasMore?: boolean;
  }> {
    if (paginated) {
      const parsedLimit = parseInt(limit as any, 10) || 20; // Default to 10 if limit is not provided
      return this.postService.findAllPagination(parsedLimit, cursor);
    } else {
      return { posts: await this.postService.findAll(), paginated };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostEntity> {
    return this.postService.findOne(id);
  }

  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: { content?: string },
  ): Promise<PostEntity> {
    return this.postService.updatePost(id, updatePostDto);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string): Promise<void> {
    return this.postService.deletePost(id);
  }
}
