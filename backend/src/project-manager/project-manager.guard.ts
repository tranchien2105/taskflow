import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ProjectMembersService } from '../project-members/project-members.service';

@Injectable()
export class ProjectManagerGuard implements CanActivate {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userId = request.user.userId;

    const projectId = request.params.projectId ?? request.params.id;

    if (!projectId) {
      throw new ForbiddenException('Project context not found');
    }

    const isManager = await this.projectMembersService.isManager(
      projectId,
      userId,
    );

    if (!isManager) {
      throw new ForbiddenException(
        'Only project managers can perform this action',
      );
    }

    return true;
  }
}
