import { IsHexColor, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsHexColor()
  color!: string;
}
