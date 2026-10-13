
import { Injectable } from '@nestjs/common';
import { TasksService } from '../../tasks/tasks.service';
import { AiTask } from '../interfaces/ai-task.interface';

@Injectable()
export class TaskQueryHandler {
    constructor(
        private readonly tasksService: TasksService,
    ) {}

    async handle(
        message: string,
        userId: string,
    ): Promise<string | null> {
        const question = message.toLocaleLowerCase('vi-VN');

        const mentionsTask =
            question.includes('task') ||
            question.includes('công việc');

        const asksTaskStats =
            (
                question.includes('thống kê') &&
                mentionsTask
            ) ||
            question.includes('bao nhiêu task') ||
            question.includes('tổng số task') ||
            question.includes('số lượng task') ||
            question.includes('bao nhiêu công việc') ||
            question.includes('tổng số công việc');

        const asksOverdueTasks =
            question.includes('quá hạn') ||
            question.includes('trễ hạn') ||
            question.includes('overdue');

        const asksForHighestPriority =
            question.includes('ưu tiên cao nhất') ||
            question.includes('priority cao nhất') ||
            question.includes('độ ưu tiên cao nhất');

        const priorityMatch = question.match(
            /\b(urgent|high|medium|low)\b/i,
        );

        const asksForTaskList =
            question.includes('task') ||
            question.includes('công việc');

        const asksForSpecificPriority =
            Boolean(priorityMatch) &&
            asksForTaskList &&
            !asksForHighestPriority;

        // Không lấy task nếu câu hỏi không thuộc handler này.
        if (
            !asksTaskStats &&
            !asksOverdueTasks &&
            !asksForHighestPriority &&
            !asksForSpecificPriority
        ) {
            return null;
        }

        const tasks = (await this.tasksService.getTasksForAi(
            userId,
        )) as AiTask[];

        if (asksTaskStats) {
            const counts: Record<string, number> = {
                TODO: 0,
                IN_PROGRESS: 0,
                REVIEW: 0,
                DONE: 0,
            };

            for (const task of tasks) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        counts,
                        task.status,
                    )
                ) {
                    counts[task.status]++;
                }
            }

            return [
                'Thống kê task của bạn:',
                `- TODO (chưa bắt đầu): ${counts.TODO}`,
                `- IN_PROGRESS (đang thực hiện): ${counts.IN_PROGRESS}`,
                `- REVIEW (chờ duyệt): ${counts.REVIEW}`,
                `- DONE (đã hoàn thành): ${counts.DONE}`,
                `Tổng cộng: ${tasks.length} task.`,
            ].join('\n');
        }

        if (asksOverdueTasks) {
            const today = this.getVietnamDate();

            const overdueTasks = tasks.filter((task) => {
                if (!task.dueDate || task.status === 'DONE') {
                    return false;
                }

                const dueDate = this.toDateString(task.dueDate);

                return dueDate !== null && dueDate < today;
            });

            if (overdueTasks.length === 0) {
                return 'Không tìm thấy task nào đã quá hạn nhưng chưa hoàn thành.';
            }

            return [
                `Có ${overdueTasks.length} task đã quá hạn nhưng chưa hoàn thành:`,
                ...overdueTasks.map(
                    (task, index) =>
                        `${index + 1}. ${task.title} | Trạng thái: ${task.status} | Ưu tiên: ${task.priority} | Deadline: ${this.formatDate(task.dueDate)}`,
                ),
            ].join('\n');
        }

        if (asksForSpecificPriority && priorityMatch) {
            const requestedPriority =
                priorityMatch[1].toUpperCase();

            const matchedTasks = tasks.filter(
                (task) =>
                    task.priority.toUpperCase() === requestedPriority,
            );

            if (matchedTasks.length === 0) {
                return `Không tìm thấy task có độ ưu tiên ${requestedPriority}.`;
            }

            return [
                `Các task có độ ưu tiên ${requestedPriority} (${matchedTasks.length} task):`,
                ...matchedTasks.map(
                    (task, index) =>
                        `${index + 1}. ${task.title} | Trạng thái: ${task.status} | Deadline: ${this.formatDate(task.dueDate)}`,
                ),
            ].join('\n');
        }

        if (asksForHighestPriority) {
            const priorityRank: Record<string, number> = {
                URGENT: 4,
                HIGH: 3,
                MEDIUM: 2,
                LOW: 1,
            };

            const highestRank = Math.max(
                0,
                ...tasks.map(
                    (task) =>
                        priorityRank[task.priority.toUpperCase()] ?? 0,
                ),
            );

            if (highestRank === 0) {
                return 'Không tìm thấy task có thông tin độ ưu tiên hợp lệ.';
            }

            const highestPriority = Object.keys(priorityRank).find(
                (priority) => priorityRank[priority] === highestRank,
            );

            const highestTasks = tasks.filter(
                (task) =>
                    (priorityRank[task.priority.toUpperCase()] ?? 0) ===
                    highestRank,
            );

            return [
                `Độ ưu tiên cao nhất: ${highestPriority} (${highestTasks.length} task):`,
                ...highestTasks.map(
                    (task, index) =>
                        `${index + 1}. ${task.title} | Ưu tiên: ${task.priority} | Trạng thái: ${task.status} | Deadline: ${this.formatDate(task.dueDate)}`,
                ),
            ].join('\n');
        }

        return null;
    }

    private getVietnamDate(): string {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(new Date());

        const values = Object.fromEntries(
            parts.map((part) => [part.type, part.value]),
        );

        return `${values.year}-${values.month}-${values.day}`;
    }

    private toDateString(
        value: string | Date,
    ): string | null {
        if (typeof value === 'string') {
            const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
            return match ? match[1] : null;
        }

        if (Number.isNaN(value.getTime())) {
            return null;
        }

        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const day = String(value.getUTCDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private formatDate(
        value?: string | Date | null,
    ): string {
        if (!value) {
            return 'Chưa có deadline';
        }

        const dateString = this.toDateString(value);

        if (!dateString) {
            return 'Không xác định';
        }

        const [year, month, day] = dateString.split('-');

        return `${day}/${month}/${year}`;
    }
}
