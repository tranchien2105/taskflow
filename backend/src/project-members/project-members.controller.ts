import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ProjectMembersService } from './project-members.service';
import { ProjectAccessGuard } from '../project-access/project-access.guard';
import { ProjectManagerGuard } from '../project-manager/project-manager.guard';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @Post()
  @UseGuards(ProjectManagerGuard)
  create(
    @Param('projectId') projectId: string,
    @Body() createDto: CreateProjectMemberDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectMembersService.createInvitation(
      projectId,
      createDto.userId,
      request.user.userId,
    );
  }

  @Get()
  @UseGuards(ProjectAccessGuard)
  findAll(@Param('projectId') projectId: string) {
    return this.projectMembersService.findAll(projectId);
  }

  @Get(':userId')
  @UseGuards(ProjectAccessGuard)
  findOne(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectMembersService.findOne(projectId, userId);
  }

  @Patch(':userId')
  @UseGuards(ProjectManagerGuard)
  update(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateProjectMemberDto,
  ) {
    return this.projectMembersService.update(projectId, userId, updateDto);
  }

  @Delete(':userId')
  @UseGuards(ProjectManagerGuard)
  remove(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    console.log('DELETE MEMBER ROUTE HIT:', {
      projectId,
      userId,
    });

    return this.projectMembersService.remove(projectId, userId);
  }
}
