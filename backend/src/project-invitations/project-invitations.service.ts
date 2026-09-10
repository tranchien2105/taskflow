import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  ProjectInvitation,
  ProjectInvitationStatus,
} from './entities/project-invitation.entity';

import { ProjectMembersService } from '../project-members/project-members.service';

import { ProjectInvitationsGateway } from './project-invitations.gateway';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

import { ActivitiesService } from '../activities/activities.service';

@Injectable()
export class ProjectInvitationsService {
  constructor(
    @InjectRepository(ProjectInvitation)
    private readonly invitationRepository: Repository<ProjectInvitation>,

    @Inject(forwardRef(() => ProjectMembersService))
    private readonly projectMembersService: ProjectMembersService,

    private readonly gateway: ProjectInvitationsGateway,

    @InjectQueue('project-invitation-email')
    private readonly invitationEmailQueue: Queue,

    private readonly activitiesService: ActivitiesService,
  ) { }

  async createInvitation(
    projectId: string,
    invitedUserId: string,
    invitedByUserId: string,
  ): Promise<ProjectInvitation> {
    /**
     * Check pending invitation
     */
    const existingInvitation =
      await this.invitationRepository.findOne({
        where: {
          projectId,
          invitedUserId,
          status: ProjectInvitationStatus.PENDING,
        },
      });

    if (existingInvitation) {
      throw new BadRequestException(
        'This user already has a pending invitation.',
      );
    }

    /**
     * Create invitation
     */
    const invitation =
      this.invitationRepository.create({
        projectId,
        invitedUserId,
        invitedByUserId,
        status: ProjectInvitationStatus.PENDING,
      });

    const savedInvitation =
      await this.invitationRepository.save(
        invitation,
      );

    /**
     * Record activity
     */
    await this.activitiesService.create({
      userId: invitedByUserId,
      action: 'PROJECT_INVITATION_CREATED',
      entity: savedInvitation,
      projectId,
      entityType: 'project',
    });

    /**
     * Load project + invited user + inviter
     *
     * invitedUser:
     *   - email
     *   - name
     *
     * invitedBy:
     *   - name
     *
     * project:
     *   - name
     */
    const invitationWithRelations =
      await this.invitationRepository.findOne({
        where: {
          id: savedInvitation.id,
        },
        relations: {
          project: true,
          invitedUser: true,
          invitedBy: true,
        },
      });

    if (!invitationWithRelations) {
      throw new NotFoundException(
        'Invitation not found after creation.',
      );
    }

    /**
     * Realtime notification
     */
    this.gateway.emitInvitationCreated(
      invitedUserId,
      invitationWithRelations,
    );

    /**
     * Add project invitation email to queue
     */
    await this.invitationEmailQueue.add(
      'send-project-invitation',
      {
        invitedUserEmail:
          invitationWithRelations.invitedUser.email,

        invitedUserName:
          invitationWithRelations.invitedUser.name,

        inviterName:
          invitationWithRelations.invitedBy.name,

        projectName:
          invitationWithRelations.project.name,
      },
      {
        attempts: 3,

        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    );

    return invitationWithRelations;
  }

  async acceptInvitation(
    invitationId: string,
    userId: string,
  ): Promise<ProjectInvitation> {
    const invitation =
      await this.invitationRepository.findOne({
        where: {
          id: invitationId,
        },
      });

    if (!invitation) {
      throw new NotFoundException(
        'Invitation not found.',
      );
    }

    /**
     * Only invited user can accept invitation
     */
    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException(
        'You cannot accept this invitation.',
      );
    }

    /**
     * Only PENDING invitation can be accepted
     */
    if (
      invitation.status !==
      ProjectInvitationStatus.PENDING
    ) {
      throw new BadRequestException(
        'This invitation is no longer pending.',
      );
    }

    /**
     * Create project member
     */
    const member =
      await this.projectMembersService.create(
        invitation.projectId,
        {
          userId: invitation.invitedUserId,
        },
      );

    /**
     * Realtime notification
     */
    this.gateway.emitProjectMemberAdded(
      invitation.projectId,
      member,
    );

    /**
     * Update invitation status
     */
    invitation.status =
      ProjectInvitationStatus.ACCEPTED;

    const acceptedInvitation =
      await this.invitationRepository.save(
        invitation,
      );

    /**
     * Record activity
     */
    await this.activitiesService.create({
      userId,
      action: 'PROJECT_INVITATION_ACCEPTED',
      entity: acceptedInvitation,
      projectId: invitation.projectId,
      entityType: 'project',
    });

    return acceptedInvitation;
  }

  async rejectInvitation(
    invitationId: string,
    userId: string,
  ): Promise<ProjectInvitation> {
    const invitation =
      await this.invitationRepository.findOne({
        where: {
          id: invitationId,
        },
      });

    if (!invitation) {
      throw new NotFoundException(
        'Invitation not found.',
      );
    }

    /**
     * Only invited user can reject invitation
     */
    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException(
        'You cannot reject this invitation.',
      );
    }

    /**
     * Only PENDING invitation can be rejected
     */
    if (
      invitation.status !==
      ProjectInvitationStatus.PENDING
    ) {
      throw new BadRequestException(
        'This invitation is no longer pending.',
      );
    }

    invitation.status =
      ProjectInvitationStatus.REJECTED;

    const rejectedInvitation =
      await this.invitationRepository.save(
        invitation,
      );

    /**
     * Record activity
     */
    await this.activitiesService.create({
      userId,
      action: 'PROJECT_INVITATION_REJECTED',
      entity: rejectedInvitation,
      projectId: invitation.projectId,
      entityType: 'project',
    });

    return rejectedInvitation;
  }

  async findMyInvitations(
    userId: string,
  ): Promise<ProjectInvitation[]> {
    return this.invitationRepository.find({
      where: {
        invitedUserId: userId,
        status: ProjectInvitationStatus.PENDING,
      },

      relations: {
        project: true,
        invitedBy: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}