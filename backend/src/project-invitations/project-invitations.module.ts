import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectInvitation } from './entities/project-invitation.entity';
import { ProjectInvitationsService } from './project-invitations.service';
import { ProjectInvitationsController } from './project-invitations.controller';

import { ProjectMembersModule } from '../project-members/project-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectInvitation]),
    forwardRef(() => ProjectMembersModule),
  ],
  controllers: [  
    ProjectInvitationsController,
  ],
  providers: [
    ProjectInvitationsService,
  ],
  exports: [
    ProjectInvitationsService,
  ],
})
export class ProjectInvitationsModule { }