
import { Injectable } from '@nestjs/common';

import { TasksService } from '../tasks/tasks.service';

import { TaskQueryHandler } from './handlers/task-query.handler';
import { TaskCreateHandler } from './handlers/task-create.handler';
import { ProjectQueryHandler } from './handlers/project-query.handler';
import { ProjectCreateHandler } from './handlers/project-create.handler';

import { OllamaService } from './services/ollama.service';

type AiIntent =
    | 'CREATE_TASK'
    | 'CREATE_PROJECT'
    | 'AMBIGUOUS_CREATE'
    | 'QUERY_TASK'
    | 'QUERY_PROJECT'
    | 'GENERAL';

@Injectable()
export class AiService {
    constructor(
        private readonly tasksService: TasksService,
        private readonly taskQueryHandler: TaskQueryHandler,
        private readonly taskCreateHandler: TaskCreateHandler,
        private readonly projectQueryHandler: ProjectQueryHandler,
        private readonly projectCreateHandler: ProjectCreateHandler,
        private readonly ollamaService: OllamaService,
    ) { }

    async chat(
        message: string,
        userId: string,
    ): Promise<{ reply: string }> {
        const normalizedMessage = message.trim();

        if (!normalizedMessage) {
            return {
                reply: 'Bạn vui lòng nhập yêu cầu để mình hỗ trợ nhé.',
            };
        }

        const intent = this.classifyIntent(normalizedMessage);

        switch (intent) {
            case 'CREATE_TASK':
                return {
                    reply: await this.taskCreateHandler.handle(
                        normalizedMessage,
                        userId,
                    ),
                };

            case 'CREATE_PROJECT':
                return {
                    reply: await this.projectCreateHandler.handle(
                        normalizedMessage,
                        userId,
                    ),
                };

            case 'AMBIGUOUS_CREATE':
                return {
                    reply:
                        'Bạn đang yêu cầu tạo cả dự án mới và task. ' +
                        'Bạn muốn tạo dự án trước, hay tạo task trong một dự án đã có? ' +
                        'Mình sẽ chờ bạn xác nhận trước khi thực hiện.',
                };

            case 'QUERY_TASK': {
                const taskReply = await this.taskQueryHandler.handle(
                    normalizedMessage,
                    userId,
                );

                if (taskReply !== null) {
                    return { reply: taskReply };
                }

                break;
            }

            case 'QUERY_PROJECT': {
                const projectReply =
                    await this.projectQueryHandler.handle(
                        normalizedMessage,
                        userId,
                    );

                if (projectReply !== null) {
                    return { reply: projectReply };
                }

                break;
            }

            case 'GENERAL':
                break;
        }

        return {
            reply: await this.askGeneralQuestion(
                normalizedMessage,
                userId,
            ),
        };
    }

    /**
     * Phân loại ý định trước khi gọi handler.
     *
     * Quy tắc:
     * - "Tạo task trong dự án X" => CREATE_TASK.
     * - "Tạo dự án X" => CREATE_PROJECT.
     * - Yêu cầu tạo cả task và dự án mới => hỏi lại.
     * - Không có ý định tạo => phân loại truy vấn hoặc GENERAL.
     */
    private classifyIntent(message: string): AiIntent {
        const question = message
            .trim()
            .toLocaleLowerCase('vi-VN');

        const hasCreateAction =
            question.includes('tạo') ||
            question.includes('thêm') ||
            question.includes('khởi tạo') ||
            question.includes('create');

        const mentionsTask =
            question.includes('task') ||
            question.includes('công việc') ||
            question.includes('nhiệm vụ');

        const mentionsProject =
            question.includes('dự án') ||
            question.includes('project');

        if (hasCreateAction) {
            // Xác định người dùng có trực tiếp yêu cầu tạo task.
            // Không coi việc nhắc đến một dự án là yêu cầu tạo dự án.
            const explicitlyCreatesTask =
                /(?:tạo|thêm|khởi tạo|create)\s+(?:(?:cho tôi|giúp tôi|một)\s+)*(?:task|công việc|nhiệm vụ)/i
                    .test(question);

            // Chỉ nhận diện tạo Project khi động từ tạo đi trực tiếp
            // với đối tượng Project/dự án.
            const explicitlyCreatesProject =
                /(?:tạo|thêm|khởi tạo|create)\s+(?:(?:cho tôi|giúp tôi|một)\s+)*(?:dự án|project)/i
                    .test(question);

            if (
                explicitlyCreatesTask &&
                explicitlyCreatesProject
            ) {
                return 'AMBIGUOUS_CREATE';
            }

            // Task được ưu tiên khi dự án chỉ đóng vai trò
            // là nơi chứa task.
            if (explicitlyCreatesTask) {
                return 'CREATE_TASK';
            }

            if (explicitlyCreatesProject) {
                return 'CREATE_PROJECT';
            }

            // Có ý định tạo nhưng chưa xác định được đối tượng.
            // Không tự ý thực hiện hành động ghi dữ liệu.
            if (mentionsTask || mentionsProject) {
                return 'GENERAL';
            }
        }

        // Khi truy vấn có nhắc cả task và project,
        // ưu tiên truy vấn task vì project có thể là bộ lọc.
        if (mentionsTask) {
            return 'QUERY_TASK';
        }

        if (mentionsProject) {
            return 'QUERY_PROJECT';
        }

        return 'GENERAL';
    }

    /**
     * Xử lý các câu hỏi chưa có handler chuyên biệt.
     */
    private async askGeneralQuestion(
        message: string,
        userId: string,
    ): Promise<string> {
        const tasks = await this.tasksService.getTasksForAi(userId);

        const taskContext = JSON.stringify(
            tasks.map((task) => ({
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
            })),
        );

        const systemPrompt = [
            'Bạn là TaskFlow AI, trợ lý quản lý công việc.',
            'Trả lời bằng tiếng Việt, ngắn gọn và trực tiếp.',
            'Chỉ sử dụng dữ liệu task được cung cấp khi trả lời về task.',
            'Không tự bịa task, deadline, trạng thái hoặc số liệu.',
            'Priority: URGENT, HIGH, MEDIUM, LOW.',
            'Status: TODO, IN_PROGRESS, REVIEW, DONE.',
            'URGENT là mức ưu tiên cao nhất.',
            'Nếu dữ liệu không đủ, hãy nói rõ.',
            'Không tuyên bố đã tạo, sửa hoặc xóa dữ liệu.',
            'Các thao tác ghi dữ liệu phải được thực hiện bởi handler chuyên biệt.',
            '',
            'Dữ liệu task:',
            taskContext,
        ].join('\n');

        return this.ollamaService.chat(
            message,
            systemPrompt,
            {
                num_predict: 128,
                num_ctx: 2048,
                temperature: 0.2,
            },
        );
    }
}
