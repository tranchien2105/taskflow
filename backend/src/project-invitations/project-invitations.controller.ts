import {
    Controller,
    Get,
    Param,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';

import { ProjectInvitationsService } from './project-invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('project-invitations')
export class ProjectInvitationsController {
    constructor(
        private readonly projectInvitationsService: ProjectInvitationsService,
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    findMyInvitations(@Req() request: any) {
        return this.projectInvitationsService.findMyInvitations(
            request.user.userId,
        );
    }

    @Patch(':id/accept')
    @UseGuards(JwtAuthGuard)
    accept(
        @Param('id') id: string,
        @Req() request: any,
    ) {
        return this.projectInvitationsService.acceptInvitation(
            id,
            request.user.userId,
        );
    }

    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard)
    reject(
        @Param('id') id: string,
        @Req() request: any,
    ) {
        return this.projectInvitationsService.rejectInvitation(
            id,
            request.user.userId,
        );
    }
}