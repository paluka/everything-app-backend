// src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import logger from 'src/utils/logger';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() createUserDto: { name: string; email: string; image?: string },
  ): Promise<UserEntity> {
    const { name, email, image } = createUserDto;
    return this.userService.createUser(name, email, image);
  }

  @Get()
  async findAll(): Promise<UserEntity[]> {
    logger.log('Finding all users');
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    logger.log('Finding one user:', id);
    return this.userService.findOne(id);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body()
    updateUserDto: {
      name?: string;
      email?: string;
      image?: string;
      publicKey?: string;
      encryptedPrivateKey?: string;
    },
  ): Promise<UserEntity> {
    logger.log(`Updating user ${id} with:`, updateUserDto);
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
