import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    Inject,
    forwardRef

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    ProjectInvitation,
    ProjectInvitationStatus,
} from './entities/project-invitation.entity';

import { ProjectMembersService } from '../project-members/project-members.service';

@Injectable()
export class ProjectInvitationsService {
    constructor(
        @InjectRepository(ProjectInvitation)
        private readonly invitationRepository: Repository<ProjectInvitation>,

        @Inject(forwardRef(() => ProjectMembersService))
        private readonly projectMembersService: ProjectMembersService,
    ) { }

    async createInvitation(
        projectId: string,
        invitedUserId: string,
        invitedByUserId: string,
    ): Promise<ProjectInvitation> {
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

        const invitation =
            this.invitationRepository.create({
                projectId,
                invitedUserId,
                invitedByUserId,
                status: ProjectInvitationStatus.PENDING,
            });

        return this.invitationRepository.save(invitation);
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

        // Chỉ người được mời mới được accept
        if (invitation.invitedUserId !== userId) {
            throw new ForbiddenException(
                'You cannot accept this invitation.',
            );
        }

        // Chỉ invitation PENDING mới được accept
        if (
            invitation.status !==
            ProjectInvitationStatus.PENDING
        ) {
            throw new BadRequestException(
                'This invitation is no longer pending.',
            );
        }

        // Tạo project member
        await this.projectMembersService.create(
            invitation.projectId,
            {
                userId: invitation.invitedUserId,
            },
        );

        // Đổi trạng thái invitation
        invitation.status =
            ProjectInvitationStatus.ACCEPTED;

        return this.invitationRepository.save(
            invitation,
        );
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

        // Chỉ người được mời mới được reject
        if (invitation.invitedUserId !== userId) {
            throw new ForbiddenException(
                'You cannot reject this invitation.',
            );
        }

        // Chỉ invitation PENDING mới được reject
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

        return this.invitationRepository.save(
            invitation,
        );
    }

    async findMyInvitations(
        userId: string,
    ): Promise<ProjectInvitation[]> {
        return this.invitationRepository.find({
            where: {
                invitedUserId: userId,
                status: ProjectInvitationStatus.PENDING,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }
}