// src/post/post.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/user.entity';
import { Post } from './post.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { UserModule } from '../user/user.module';
import { AppModule } from '../app.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User]),
    UserModule,
    forwardRef(() => AppModule),
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
