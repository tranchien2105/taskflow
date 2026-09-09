import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Req,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';

import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) {}

    @Get()
    findAll(
        @Query() query: GetNotificationsDto,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.notificationsService.findAll(
            query,
            req.user.userId,
        );
    }

    @Patch(':id/read')
    async markAsRead(
        @Param('id') id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.notificationsService.markAsRead(
            id,
            req.user.userId,
        );
    }

    @Patch('read-all')
    async markAllAsRead(
        @Req() req: AuthenticatedRequest,
    ) {
        return this.notificationsService.markAllAsRead(
            req.user.userId,
        );
    }
}
