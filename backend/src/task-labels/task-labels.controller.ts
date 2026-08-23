import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';

import { TaskLabelsService } from './task-labels.service';

import { TaskProjectManagerGuard } from '../task-project-manager/task-project-manager.guard';
import { TaskProjectMemberGuard } from '../task-project-member/task-project-member.guard';

@Controller('tasks/:taskId/labels')
export class TaskLabelsController {
    constructor(
        private readonly taskLabelsService: TaskLabelsService,
    ) { }

    @Post(':labelId')
    @UseGuards(TaskProjectManagerGuard)
    attach(
        @Param('taskId') taskId: string,
        @Param('labelId') labelId: string,
    ) {
        return this.taskLabelsService.attach(
            taskId,
            labelId,
        );
    }

    @Get()
    @UseGuards(TaskProjectMemberGuard)
    findAll(
        @Param('taskId') taskId: string,
    ) {
        return this.taskLabelsService.findAll(
            taskId,
        );
    }

    @Delete(':labelId')
    @UseGuards(TaskProjectManagerGuard)
    remove(
        @Param('taskId') taskId: string,
        @Param('labelId') labelId: string,
    ) {
        return this.taskLabelsService.remove(
            taskId,
            labelId,
        );
    }
}