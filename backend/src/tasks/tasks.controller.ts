import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskAccessGuard } from '../task-access/task-access.guard';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(createTaskDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: TaskQueryDto, @Req() req: any) {
    return this.tasksService.findAll(query, req.user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Req() req: any,
  ) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(TaskAccessGuard)
  update(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body() updateTaskDto: UpdateTaskDto,

    @Req() req: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(TaskAccessGuard)
  remove(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Req() req: any,
  ) {
    return this.tasksService.remove(id, req.user.userId);
  }
}
