import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LabelsService } from './labels.service';

import { CreateLabelDto } from './dto/create-label.dto';

import { UpdateLabelDto } from './dto/update-label.dto';

import { ProjectManagerGuard } from '../project-manager/project-manager.guard';

import { ProjectAccessGuard } from '../project-access/project-access.guard';

import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('projects/:projectId/labels')
export class LabelsController {
  constructor(
    private readonly labelsService: LabelsService,
  ) { }

  @Post()
  @UseGuards(ProjectManagerGuard)
  create(
    @Param('projectId') projectId: string,
    @Body() createDto: CreateLabelDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.labelsService.create(
      projectId,
      createDto,
      req.user.userId,
    );
  }

  @Get()
  @UseGuards(ProjectAccessGuard)
  findAll(
    @Param('projectId') projectId: string,
  ) {
    return this.labelsService.findAll(
      projectId,
    );
  }

  @Get(':id')
  @UseGuards(ProjectAccessGuard)
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.labelsService.findOne(
      projectId,
      id,
    );
  }

  @Patch(':id')
  @UseGuards(ProjectManagerGuard)
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateLabelDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.labelsService.update(
      projectId,
      id,
      updateDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @UseGuards(ProjectManagerGuard)
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.labelsService.remove(
      projectId,
      id,
      req.user.userId,
    );
  }
}