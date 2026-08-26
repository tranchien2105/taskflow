import { IsEnum, IsUUID } from 'class-validator';

import { ProjectMemberRole } from '../entities/project-member.entity';

export class CreateProjectMemberDto {
  @IsUUID()
  userId!: string;
}
