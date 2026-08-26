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

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { QueryProjectDto } from './dto/query-project.dto';
import { ProjectManagerGuard } from '../project-manager/project-manager.guard';

import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.create(createProjectDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: QueryProjectDto, @Req() req: AuthenticatedRequest) {
    return this.projectsService.findAll(query, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.projectsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(ProjectManagerGuard)
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(ProjectManagerGuard)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
