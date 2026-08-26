import { IsEnum } from 'class-validator';

import { ProjectMemberRole } from '../entities/project-member.entity';

export class UpdateProjectMemberDto {
  @IsEnum(ProjectMemberRole)
  role!: ProjectMemberRole;
}
