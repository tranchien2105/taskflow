import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';

import { DashboardService } from './dashboard.service';

import { ProjectMember } from '../project-members/entities/project-member.entity';

import { Task } from '../tasks/entities/task.entity';

import { ActivityEntity } from '../activities/entities/activity.entity';

import { User } from '../users/entities/user.entity';

import { PresenceModule } from '../presence/presence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectMember,
      Task,
      ActivityEntity,
      User,
    ]),

    PresenceModule,
  ],

  controllers: [
    DashboardController,
  ],

  providers: [
    DashboardService,
  ],
})
export class DashboardModule { }