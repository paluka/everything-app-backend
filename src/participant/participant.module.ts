import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantEntity } from './participant.entity';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipantEntity])],
  providers: [ParticipantService],
  controllers: [ParticipantController],
  // exports: [ParticipantService], // Export if other modules need access
})
export class ParticipantModule {}
