// src/user/user.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppModule } from '../app.module';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Post } from '../post/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post]),
    forwardRef(() => AppModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
