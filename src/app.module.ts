import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';
import { MessageModule } from './message/message.module';
import { ConversationModule } from './conversation/conversation.module';
import { ParticipantModule } from './participant/participant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Load .env file
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      // entities: [__dirname + '/**/*.entity{.ts,.js}'], // Explicitly load entities
      autoLoadEntities: true,
      synchronize: false, // Set to 'true' only in development
    }),

    CacheModule.register({
      // Redis caching
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore as any,
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT,
        ttl: parseInt(process.env.REDIS_TTL), // Time-to-live for cached data (in seconds)
      }),
    }),

    PostModule,
    UserModule,
    MessageModule,
    ConversationModule,
    ParticipantModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [CacheModule],
})
export class AppModule {}
