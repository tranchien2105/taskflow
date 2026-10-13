
import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../../projects/projects.service';

@Injectable()
export class ProjectQueryHandler {
    constructor(
        private readonly projectsService: ProjectsService,
    ) {}

    async handle(
        message: string,
        userId: string,
    ): Promise<string | null> {
        const question = message.toLocaleLowerCase('vi-VN');

        const asksProjectStats =
            question.includes('bao nhiêu dự án') ||
            question.includes('bao nhiêu project') ||
            question.includes('tổng số dự án') ||
            question.includes('tổng số project') ||
            question.includes('thống kê dự án') ||
            question.includes('thống kê project');

        if (!asksProjectStats) {
            return null;
        }

        const stats =
            await this.projectsService.getAiProjectStats(userId);

        return [
            `Bạn hiện tham gia ${stats.total} dự án.`,
            `- PLANNING (đang lên kế hoạch): ${stats.counts.PLANNING}`,
            `- ACTIVE (đang hoạt động): ${stats.counts.ACTIVE}`,
            `- ON_HOLD (tạm dừng): ${stats.counts.ON_HOLD}`,
            `- COMPLETED (đã hoàn thành): ${stats.counts.COMPLETED}`,
            `- ARCHIVED (đã lưu trữ): ${stats.counts.ARCHIVED}`,
        ].join('\n');
    }
}
