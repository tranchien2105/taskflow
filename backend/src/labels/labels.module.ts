import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Label } from './entities/label.entity';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';

import { ProjectMembersModule } from '../project-members/project-members.module';
import { ProjectManagerGuard } from '../project-manager/project-manager.guard';
import { ProjectAccessGuard } from '../project-access/project-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Label]), ProjectMembersModule],

  controllers: [LabelsController],

  providers: [LabelsService, ProjectManagerGuard, ProjectAccessGuard],

  exports: [LabelsService],
})
export class LabelsModule {}
