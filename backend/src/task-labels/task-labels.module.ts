import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskLabel } from './entities/task-label.entity';
import { TaskLabelsService } from './task-labels.service';
import { TaskLabelsController } from './task-labels.controller';

import { Task } from '../tasks/entities/task.entity';
import { Label } from '../labels/entities/label.entity';

import { ProjectMembersModule } from '../project-members/project-members.module';

import { TaskProjectManagerGuard } from '../task-project-manager/task-project-manager.guard';
import { TaskProjectMemberGuard } from '../task-project-member/task-project-member.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskLabel, Task, Label]),
    ProjectMembersModule,
  ],

  controllers: [TaskLabelsController],

  providers: [
    TaskLabelsService,
    TaskProjectManagerGuard,
    TaskProjectMemberGuard,
  ],

  exports: [TaskLabelsService],
})
export class TaskLabelsModule {}
