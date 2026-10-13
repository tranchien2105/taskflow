
import {
  Body,
  Controller,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AiService } from './ai.service';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';

class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('chat')
  chat(
    @Body() body: ChatDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.aiService.chat(
      body.message,
      request.user.userId,
    );
  }
}
