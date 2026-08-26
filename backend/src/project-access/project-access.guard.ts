import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ProjectMembersService } from '../project-members/project-members.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
  params: {
    projectId: string;
  };
}

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = request.user.userId;
    const projectId = request.params.projectId;

    const isMember = await this.projectMembersService.isMember(
      projectId,
      userId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return true;
  }
}
