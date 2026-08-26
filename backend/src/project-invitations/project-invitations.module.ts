import { Module, forwardRef } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectInvitation } from './entities/project-invitation.entity';

import { ProjectInvitationsService } from './project-invitations.service';

import { ProjectInvitationsController } from './project-invitations.controller';

import { ProjectInvitationsGateway } from './project-invitations.gateway';

import { ProjectMembersModule } from '../project-members/project-members.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectInvitation]),

    forwardRef(() => ProjectMembersModule),

    AuthModule,
  ],

  controllers: [ProjectInvitationsController],

  providers: [ProjectInvitationsService, ProjectInvitationsGateway],

  exports: [ProjectInvitationsService],
})
export class ProjectInvitationsModule {}
