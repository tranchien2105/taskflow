import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from '../tasks/entities/task.entity';
import { ProjectMembersService } from '../project-members/project-members.service';

@Injectable()
export class TaskProjectMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    private readonly projectMembersService: ProjectMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userId = request.user.userId;
    const taskId = request.params.taskId;

    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isMember = await this.projectMembersService.isMember(
      task.projectId,
      userId,
    );

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return true;
  }
}
