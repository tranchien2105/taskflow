import {
    Controller,
    Get,
    Req,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
    ) { }

    @Get()
    getDashboard(
        @Req() req: AuthenticatedRequest,
    ) {
        return this.dashboardService.getDashboard(
            req.user.userId,
            req.user.role,
        );
    }
}