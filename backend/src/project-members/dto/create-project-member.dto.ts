import { IsUUID } from 'class-validator';

export class CreateProjectMemberDto {
  @IsUUID()
  userId!: string;
}
