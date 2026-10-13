
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    HttpException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { TasksService } from '../../tasks/tasks.service';
import { CreateTaskDto } from '../../tasks/dto/create-task.dto';
import {
    TaskPriority,
    TaskStatus,
} from '../../tasks/entities/task.entity';

import { ProjectsService } from '../../projects/projects.service';
import { QueryProjectDto } from '../../projects/dto/query-project.dto';

import { OllamaService } from '../services/ollama.service';

interface TaskDraft {
    projectName?: unknown;
    title?: unknown;
    description?: unknown;
    status?: unknown;
    priority?: unknown;
    dueDate?: unknown;
    assigneeId?: unknown;
}

interface NormalizedValue<T> {
    valid: boolean;
    value?: T;
}

@Injectable()
export class TaskCreateHandler {
    private readonly logger = new Logger(TaskCreateHandler.name);

    constructor(
        private readonly tasksService: TasksService,
        private readonly projectsService: ProjectsService,
        private readonly ollamaService: OllamaService,
    ) { }

    async handle(
        message: string,
        userId: string,
    ): Promise<string> {
        try {
            // 1. Kiểm tra yêu cầu đầu vào.
            const input = message.trim();

            if (!input) {
                return 'Bạn vui lòng mô tả task muốn tạo.';
            }

            // 2. Trích xuất dữ liệu từ Ollama.
            const draft = await this.extractTaskDraft(input);

            // 3. Kiểm tra tên dự án.
            const projectName = this.readRequiredString(
                draft.projectName,
            );

            if (!projectName) {
                return 'Bạn muốn tạo task trong dự án nào? Hãy cung cấp tên dự án.';
            }

            // 4. Kiểm tra tiêu đề.
            const title = this.readRequiredString(draft.title);

            if (!title) {
                return 'Mình chưa xác định được tiêu đề task. Task chưa được tạo.';
            }

            if (title.length > 200) {
                return 'Tiêu đề task không được vượt quá 200 ký tự. Task chưa được tạo.';
            }

            // 5. Kiểm tra mô tả.
            const descriptionResult = this.normalizeDescription(
                draft.description,
            );

            if (!descriptionResult.valid) {
                return 'Mô tả task không hợp lệ. Task chưa được tạo.';
            }

            // 6. Chuẩn hóa trạng thái.
            const statusResult = this.normalizeEnum(
                draft.status,
                Object.values(TaskStatus),
                TaskStatus.TODO,
            );

            if (!statusResult.valid) {
                return (
                    `Trạng thái task không hợp lệ. ` +
                    `Các giá trị được hỗ trợ: ${Object.values(TaskStatus).join(', ')}. ` +
                    'Task chưa được tạo.'
                );
            }

            // 7. Chuẩn hóa mức ưu tiên.
            const priorityResult = this.normalizeEnum(
                draft.priority,
                Object.values(TaskPriority),
                TaskPriority.MEDIUM,
            );

            if (!priorityResult.valid) {
                return (
                    `Mức ưu tiên không hợp lệ. ` +
                    `Các giá trị được hỗ trợ: ${Object.values(TaskPriority).join(', ')}. ` +
                    'Task chưa được tạo.'
                );
            }

            // 8. Chuẩn hóa deadline.
            // Không có deadline thì để undefined, không tự đặt ngày.
            const dueDateResult = this.normalizeDate(draft.dueDate);

            if (!dueDateResult.valid) {
                return (
                    'Deadline không hợp lệ. Vui lòng cung cấp ngày có thật ' +
                    'theo định dạng YYYY-MM-DD. Task chưa được tạo.'
                );
            }

            // 9. Kiểm tra assigneeId.
            const assigneeResult = this.normalizeAssigneeId(
                draft.assigneeId,
            );

            if (!assigneeResult.valid) {
                return (
                    'Không xác định được UUID người thực hiện hợp lệ. ' +
                    'Task chưa được tạo.'
                );
            }

            // 10. Tìm dự án trong phạm vi user hiện tại.
            const query = plainToInstance(QueryProjectDto, {
                search: projectName,
                page: 1,
                limit: 10,
            });

            const projects = await this.projectsService.findAll(
                query,
                userId,
            );

            const normalizeName = (value: string) =>
                value.trim().toLocaleLowerCase('vi');

            const matchedProjects = projects.data.filter(
                (project) =>
                    normalizeName(project.name) ===
                    normalizeName(projectName),
            );

            if (matchedProjects.length === 0) {
                return (
                    `Không tìm thấy dự án "${projectName}" ` +
                    'trong các dự án bạn có quyền truy cập. ' +
                    'Task chưa được tạo. Hãy kiểm tra lại tên dự án.'
                );
            }

            if (matchedProjects.length > 1) {
                return (
                    `Có nhiều dự án trùng tên "${projectName}". ` +
                    'Vui lòng cung cấp thêm thông tin để xác định đúng dự án.'
                );
            }

            const project = matchedProjects[0];

            // 11. Tạo DTO từ dữ liệu đã kiểm tra.
            const dtoInput: Record<string, unknown> = {
                projectId: project.id,
                title,
                status: statusResult.value,
                priority: priorityResult.value,
            };

            if (descriptionResult.value !== undefined) {
                dtoInput.description = descriptionResult.value;
            }

            if (dueDateResult.value !== undefined) {
                dtoInput.dueDate = dueDateResult.value;
            }

            if (assigneeResult.value !== undefined) {
                dtoInput.assigneeId = assigneeResult.value;
            }

            const dto = plainToInstance(CreateTaskDto, dtoInput);

            const errors = await validate(dto);

            if (errors.length > 0) {
                const details = errors
                    .flatMap((error) =>
                        Object.values(error.constraints ?? {}),
                    )
                    .join('; ');

                this.logger.warn(
                    `Invalid task data: ${details}`,
                );

                return (
                    `Thông tin task chưa hợp lệ: ${details}. ` +
                    'Task chưa được tạo.'
                );
            }

            // 12. Gọi service hiện tại.
            // Service tiếp tục kiểm tra thành viên dự án,
            // người thực hiện, lưu task và ghi activity.
            const createdTask = await this.tasksService.create(
                dto,
                userId,
            );

            // 13. Chỉ trả thông tin từ task đã được service lưu.
            return [
                'Tạo task thành công!',
                `- Task ID: ${createdTask.id}`,
                `- Tiêu đề: ${createdTask.title}`,
                `- Mô tả: ${createdTask.description ?? 'Không có mô tả'}`,
                `- Dự án: ${project.name}`,
                `- Project ID: ${createdTask.projectId}`,
                `- Trạng thái: ${createdTask.status}`,
                `- Mức ưu tiên: ${createdTask.priority}`,
                `- Người tạo ID: ${createdTask.creatorId}`,
                `- Người thực hiện ID: ${createdTask.assigneeId ?? 'Chưa chỉ định'}`,
                `- Deadline: ${this.formatDate(createdTask.dueDate)}`,
                `- Thời gian tạo: ${this.formatDateTime(createdTask.createdAt)}`,
            ].join('\n');
        } catch (error: unknown) {
            if (error instanceof ConflictException) {
                return `Không thể tạo task do dữ liệu bị xung đột: ${error.message}`;
            }

            if (error instanceof ForbiddenException) {
                return (
                    'Bạn không có quyền tạo task trong dự án này, ' +
                    'hoặc người được giao không thuộc dự án.'
                );
            }

            if (error instanceof BadRequestException) {
                return `Dữ liệu không hợp lệ: ${error.message}`;
            }

            if (error instanceof HttpException) {
                return `Không thể tạo task: ${error.message}`;
            }

            this.logger.error(
                'Failed to create task through AI',
                error instanceof Error
                    ? error.stack
                    : String(error),
            );

            return (
                'Không thể hoàn tất yêu cầu tạo task. ' +
                'Vui lòng kiểm tra dữ liệu và trạng thái database trước khi thử lại.'
            );
        }
    }

    private async extractTaskDraft(
        message: string,
    ): Promise<TaskDraft> {
        const systemPrompt = [
            'Bạn là bộ trích xuất dữ liệu tạo Task cho TaskFlow.',
            'Chỉ trích xuất thông tin từ yêu cầu người dùng.',
            'Không tự tạo, cập nhật hoặc xóa dữ liệu.',
            'Không khẳng định task đã được lưu.',
            '',
            `Ngày hiện tại tại Việt Nam: ${this.getVietnamDate()}.`,
            'Múi giờ: Asia/Ho_Chi_Minh.',
            '',
            'Trả về duy nhất một JSON object theo schema:',
            '{',
            '  "projectName": "string hoặc null",',
            '  "title": "string hoặc null",',
            '  "description": "string hoặc null",',
            '  "status": "TODO | IN_PROGRESS | REVIEW | DONE",',
            '  "priority": "LOW | MEDIUM | HIGH | URGENT",',
            '  "dueDate": "YYYY-MM-DD hoặc null",',
            '  "assigneeId": "UUID rõ ràng do người dùng cung cấp hoặc null"',
            '}',
            '',
            'Quy tắc bắt buộc:',
            '- projectName là tên dự án đã tồn tại được người dùng nhắc tới.',
            '- Không tự tạo tên dự án khi người dùng không cung cấp.',
            '- Không tạo dự án mới; chỉ trích xuất tên dự án.',
            '- title là tiêu đề task, không được tự bịa.',
            '- status chỉ nhận TODO, IN_PROGRESS, REVIEW, DONE.',
            '- priority chỉ nhận LOW, MEDIUM, HIGH, URGENT.',
            '- Mặc định status là TODO nếu người dùng không chỉ định.',
            '- Mặc định priority là MEDIUM nếu người dùng không chỉ định.',
            '- Deadline không được người dùng đề cập thì trả về null.',
            '- Ngày mai là ngày hiện tại cộng một ngày theo múi giờ Việt Nam.',
            '- Hôm nay là ngày hiện tại tại Việt Nam.',
            '- Chuyển các ngày tương đối thành YYYY-MM-DD.',
            '- Không tự đặt deadline để lấp chỗ trống.',
            '- Không tự suy đoán UUID người thực hiện.',
            '- Nếu không có assigneeId rõ ràng, trả về null.',
            '- Không trả về Markdown hoặc văn bản ngoài JSON.',
        ].join('\n');

        return this.ollamaService.generateJson<TaskDraft>(
            message,
            systemPrompt,
            {
                num_predict: 256,
                num_ctx: 2048,
                temperature: 0,
            },
        );
    }

    private readRequiredString(
        value: unknown,
    ): string | null {
        if (typeof value !== 'string') {
            return null;
        }

        const normalized = value.trim();

        return normalized.length > 0 ? normalized : null;
    }

    private normalizeDescription(
        value: unknown,
    ): NormalizedValue<string> {
        if (value === null || value === undefined || value === '') {
            return {
                valid: true,
                value: undefined,
            };
        }

        if (typeof value !== 'string') {
            return { valid: false };
        }

        return {
            valid: true,
            value: value.trim(),
        };
    }

    private normalizeEnum<T extends string>(
        value: unknown,
        allowedValues: readonly T[],
        defaultValue: T,
    ): NormalizedValue<T> {
        if (value === null || value === undefined || value === '') {
            return {
                valid: true,
                value: defaultValue,
            };
        }

        if (typeof value !== 'string') {
            return { valid: false };
        }

        const normalized = value.trim().toUpperCase();

        const matchedValue = allowedValues.find(
            (allowed) => allowed === normalized,
        );

        if (!matchedValue) {
            return { valid: false };
        }

        return {
            valid: true,
            value: matchedValue,
        };
    }

    private normalizeDate(
        value: unknown,
    ): NormalizedValue<string> {
        if (value === null || value === undefined || value === '') {
            return {
                valid: true,
                value: undefined,
            };
        }

        if (typeof value !== 'string') {
            return { valid: false };
        }

        const date = value.trim();

        // Chỉ nhận ngày dạng YYYY-MM-DD.
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return { valid: false };
        }

        const [year, month, day] = date.split('-').map(Number);

        const parsed = new Date(
            Date.UTC(year, month - 1, day),
        );

        const isRealDate =
            parsed.getUTCFullYear() === year &&
            parsed.getUTCMonth() === month - 1 &&
            parsed.getUTCDate() === day;

        if (!isRealDate) {
            return { valid: false };
        }

        return {
            valid: true,
            value: date,
        };
    }

    private normalizeAssigneeId(
        value: unknown,
    ): NormalizedValue<string> {
        if (value === null || value === undefined || value === '') {
            return {
                valid: true,
                value: undefined,
            };
        }

        if (typeof value !== 'string') {
            return { valid: false };
        }

        const id = value.trim();

        const uuidPattern =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidPattern.test(id)) {
            return { valid: false };
        }

        return {
            valid: true,
            value: id,
        };
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

    private formatDate(
        value?: string | Date | null,
    ): string {
        if (!value) {
            return 'Chưa đặt deadline';
        }

        let dateString: string;

        if (typeof value === 'string') {
            const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

            if (!match) {
                return 'Không xác định';
            }

            dateString = match[1];
        } else {
            if (Number.isNaN(value.getTime())) {
                return 'Không xác định';
            }

            const year = value.getUTCFullYear();
            const month = String(
                value.getUTCMonth() + 1,
            ).padStart(2, '0');
            const day = String(
                value.getUTCDate(),
            ).padStart(2, '0');

            dateString = `${year}-${month}-${day}`;
        }

        const [year, month, day] = dateString.split('-');

        return `${day}/${month}/${year}`;
    }

    private formatDateTime(
        value?: Date | string | null,
    ): string {
        if (!value) {
            return 'Không xác định';
        }

        const date = value instanceof Date
            ? value
            : new Date(value);

        if (Number.isNaN(date.getTime())) {
            return 'Không xác định';
        }

        return new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(date);
    }
}
