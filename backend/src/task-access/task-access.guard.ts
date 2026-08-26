import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TasksService } from '../tasks/tasks.service';
import { ProjectMembersService } from '../project-members/project-members.service';
import { ProjectMemberRole } from '../project-members/entities/project-member.entity';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Injectable()
export class TaskAccessGuard implements CanActivate {
  constructor(
    private readonly tasksService: TasksService,
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = request.user.userId;
    const taskId = request.params.id;

    if (typeof taskId !== 'string') {
      throw new ForbiddenException('Task context not found');
    }

    const task = await this.tasksService.findOneWithoutAuth(taskId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const role = await this.projectMembersService.getRole(
      task.projectId,
      userId,
    );

    if (!role) {
      throw new ForbiddenException('You do not have access to this task');
    }

    // DELETE chỉ Manager
    if (request.method === 'DELETE') {
      if (role !== ProjectMemberRole.MANAGER) {
        throw new ForbiddenException('Only project managers can delete tasks');
      }

      return true;
    }

    // UPDATE
    if (request.method === 'PATCH') {
      if (role === ProjectMemberRole.MANAGER) {
        return true;
      }

      if (task.assigneeId !== userId) {
        throw new ForbiddenException(
          'You can only update tasks assigned to you',
        );
      }

      return true;
    }

    return true;
  }
}
