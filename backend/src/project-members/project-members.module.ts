import { Module, forwardRef } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectMember } from './entities/project-member.entity';

import { ProjectMembersService } from './project-members.service';

import { ProjectMembersController } from './project-members.controller';

import { ProjectAccessGuard } from '../project-access/project-access.guard';

import { ProjectManagerGuard } from '../project-manager/project-manager.guard';

import { ProjectInvitationsModule } from '../project-invitations/project-invitations.module';

import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectMember]),

    forwardRef(() => ProjectInvitationsModule),

    ActivitiesModule,
  ],

  controllers: [
    ProjectMembersController,
  ],

  providers: [
    ProjectMembersService,
    ProjectAccessGuard,
    ProjectManagerGuard,
  ],

  exports: [
    ProjectMembersService,
  ],
})
export class ProjectMembersModule { }