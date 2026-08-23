import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

import { ProjectManagerGuard } from '../project-manager/project-manager.guard';
import { ProjectAccessGuard } from '../project-access/project-access.guard';

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
    ) {
        return this.labelsService.create(
            projectId,
            createDto,
        );
    }

    @Get()
    @UseGuards(ProjectAccessGuard)
    findAll(
        @Param('projectId') projectId: string,
    ) {
        return this.labelsService.findAll(projectId);
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
    ) {
        return this.labelsService.update(
            projectId,
            id,
            updateDto,
        );
    }

    @Delete(':id')
    @UseGuards(ProjectManagerGuard)
    remove(
        @Param('projectId') projectId: string,
        @Param('id') id: string,
    ) {
        return this.labelsService.remove(
            projectId,
            id,
        );
    }
}