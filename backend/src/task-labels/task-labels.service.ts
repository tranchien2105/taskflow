import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaskLabel } from './entities/task-label.entity';
import { Task } from '../tasks/entities/task.entity';
import { Label } from '../labels/entities/label.entity';

@Injectable()
export class TaskLabelsService {
  constructor(
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,

    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
  ) {}

  async attach(taskId: string, labelId: string): Promise<TaskLabel> {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const label = await this.labelRepository.findOne({
      where: {
        id: labelId,
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    if (label.projectId !== task.projectId) {
      throw new ConflictException('Label does not belong to the task project');
    }

    const existing = await this.taskLabelRepository.findOne({
      where: {
        taskId,
        labelId,
      },
    });

    if (existing) {
      throw new ConflictException('Label is already attached to this task');
    }

    const taskLabel = this.taskLabelRepository.create({
      taskId,
      labelId,
    });

    const savedTaskLabel = await this.taskLabelRepository.save(taskLabel);

    return this.findOne(savedTaskLabel.taskId, savedTaskLabel.labelId);
  }

  async findAll(taskId: string): Promise<TaskLabel[]> {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.taskLabelRepository.find({
      where: {
        taskId,
      },
      relations: {
        label: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async remove(taskId: string, labelId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const taskLabel = await this.taskLabelRepository.findOne({
      where: {
        taskId,
        labelId,
      },
    });

    if (!taskLabel) {
      throw new NotFoundException('Label is not attached to this task');
    }

    await this.taskLabelRepository.remove(taskLabel);
  }

  private async findOne(taskId: string, labelId: string): Promise<TaskLabel> {
    const taskLabel = await this.taskLabelRepository.findOne({
      where: {
        taskId,
        labelId,
      },
      relations: {
        label: true,
      },
    });

    if (!taskLabel) {
      throw new NotFoundException('Task label not found');
    }

    return taskLabel;
  }
}
