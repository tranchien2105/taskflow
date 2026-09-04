import { Controller, Get, Query, Req } from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) { }

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
}