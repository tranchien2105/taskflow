import { Module, forwardRef } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectInvitation } from './entities/project-invitation.entity';

import { ProjectInvitationsService } from './project-invitations.service';

import { ProjectInvitationsController } from './project-invitations.controller';

import { ProjectInvitationsGateway } from './project-invitations.gateway';

import { ProjectMembersModule } from '../project-members/project-members.module';

import { AuthModule } from '../auth/auth.module';

import { MailModule } from '../mail/mail.module';

import { BullModule } from '@nestjs/bullmq';

import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectInvitation,
    ]),

    BullModule.registerQueue({
      name: 'project-invitation-email',
    }),

    forwardRef(
      () => ProjectMembersModule,
    ),

    AuthModule,

    MailModule,

    ActivitiesModule,
  ],

  controllers: [
    ProjectInvitationsController,
  ],

  providers: [
    ProjectInvitationsService,
    ProjectInvitationsGateway,
  ],

  exports: [
    ProjectInvitationsService,
  ],
})
export class ProjectInvitationsModule { }