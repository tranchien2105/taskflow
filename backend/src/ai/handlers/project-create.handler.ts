
import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateProjectDto } from '../../projects/dto/create-project.dto';
import {
    ProjectPriority,
    ProjectStatus,
} from '../../projects/entities/project.entity';
import { ProjectsService } from '../../projects/projects.service';
import { OllamaService } from '../services/ollama.service';

interface AiProjectDraft {
    name?: unknown;
    description?: unknown;
    status?: unknown;
    priority?: unknown;
    startDate?: unknown;
    dueDate?: unknown;
}

@Injectable()
export class ProjectCreateHandler {
    private readonly logger = new Logger(ProjectCreateHandler.name);

    constructor(
        private readonly projectsService: ProjectsService,
        private readonly ollamaService: OllamaService,
    ) { }

    async handle(
        message: string,
        userId: string,
    ): Promise<string> {
        let draft: AiProjectDraft;

        try {
            draft = await this.extractProjectDraft(message);
        } catch (error: unknown) {
            const detail =
                error instanceof Error
                    ? error.message
                    : String(error);

            this.logger.warn(`Project extraction failed: ${detail}`);

            return 'Mình chưa trích xuất được thông tin dự án hợp lệ. Dự án chưa được tạo. Bạn hãy thử mô tả lại yêu cầu.';
        }

        // 1. Validate tên dự án.
        if (
            typeof draft.name !== 'string' ||
            !draft.name.trim()
        ) {
            return 'Mình chưa xác định được tên dự án. Dự án chưa được tạo.';
        }

        const name = draft.name.trim();

        if (name.length > 150) {
            return 'Tên dự án không được dài quá 150 ký tự. Dự án chưa được tạo.';
        }

        const slug = this.generateSlug(name);

        if (!slug) {
            return 'Không thể tạo slug hợp lệ từ tên dự án. Dự án chưa được tạo.';
        }

        // 2. Chuẩn hóa status.
        // Chỉ mặc định PLANNING nếu AI không cung cấp status.
        const statusResult = this.normalizeEnum(
            draft.status,
            Object.values(ProjectStatus),
            ProjectStatus.PLANNING,
        );

        if (!statusResult.valid) {
            this.logger.warn(
                `Invalid project status returned by Ollama: ${String(draft.status)}`,
            );

            return [
                'Trạng thái dự án không hợp lệ.',
                `Các trạng thái được hỗ trợ: ${Object.values(ProjectStatus).join(', ')}.`,
                'Dự án chưa được tạo.',
            ].join(' ');
        }

        // 3. Chuẩn hóa priority.
        const priorityResult = this.normalizeEnum(
            draft.priority,
            Object.values(ProjectPriority),
            ProjectPriority.MEDIUM,
        );

        if (!priorityResult.valid) {
            this.logger.warn(
                `Invalid project priority returned by Ollama: ${String(draft.priority)}`,
            );

            return [
                'Mức ưu tiên dự án không hợp lệ.',
                `Các mức ưu tiên được hỗ trợ: ${Object.values(ProjectPriority).join(', ')}.`,
                'Dự án chưa được tạo.',
            ].join(' ');
        }

        // 4. Chỉ nhận description dạng string.
        if (
            draft.description !== null &&
            draft.description !== undefined &&
            typeof draft.description !== 'string'
        ) {
            return 'Mô tả dự án không hợp lệ. Dự án chưa được tạo.';
        }

        const description =
            typeof draft.description === 'string'
                ? draft.description.trim()
                : undefined;

        // 5. Kiểm tra ngày trước khi tạo DTO.
        const startDateResult = this.normalizeDate(draft.startDate);
        const dueDateResult = this.normalizeDate(draft.dueDate);

        if (!startDateResult.valid || !dueDateResult.valid) {
            return 'Ngày bắt đầu hoặc ngày đến hạn không hợp lệ. Vui lòng dùng ngày hợp lệ theo định dạng YYYY-MM-DD. Dự án chưa được tạo.';
        }

        const startDate = startDateResult.value;
        const dueDate = dueDateResult.value;

        if (startDate && dueDate && dueDate < startDate) {
            return 'Ngày đến hạn không được trước ngày bắt đầu. Dự án chưa được tạo.';
        }

        // 6. Tạo DTO và validate bằng class-validator.
        const dtoInput: Record<string, unknown> = {
            name,
            slug,
            status: statusResult.value,
            priority: priorityResult.value,
        };

        if (description !== undefined) {
            dtoInput.description = description;
        }

        if (startDate) {
            dtoInput.startDate = startDate;
        }

        if (dueDate) {
            dtoInput.dueDate = dueDate;
        }

        const dto = plainToInstance(CreateProjectDto, dtoInput);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const details = errors
                .flatMap((error) =>
                    Object.values(error.constraints ?? {}),
                )
                .join('; ');

            this.logger.warn(`Invalid project data: ${details}`);

            return `Thông tin dự án không hợp lệ: ${details}. Dự án chưa được tạo.`;
        }

        // 7. Lưu database.
        try {
            const project = await this.projectsService.create(
                dto,
                userId,
            );

            return [
                'Tạo dự án thành công!',
                `- ID: ${project.id}`,
                `- Tên: ${project.name}`,
                `- Slug: ${project.slug}`,
                `- Trạng thái: ${project.status}`,
                `- Ưu tiên: ${project.priority}`,
                `- Ngày bắt đầu: ${this.formatDate(project.startDate)}`,
                `- Ngày đến hạn: ${this.formatDate(project.dueDate)}`,
            ].join('\n');
        } catch (error: unknown) {
            if (error instanceof ConflictException) {
                return `Không thể tạo dự án vì slug "${slug}" đã tồn tại. Dự án chưa được tạo.`;
            }

            if (error instanceof BadRequestException) {
                return `Dữ liệu dự án không được chấp nhận: ${error.message}`;
            }

            const detail =
                error instanceof Error
                    ? error.message
                    : String(error);

            this.logger.error(`Project creation failed: ${detail}`);

            return 'Không thể lưu dự án vào database. Dự án chưa được xác nhận tạo thành công. Vui lòng thử lại sau.';
        }
    }

    private async extractProjectDraft(
        message: string,
    ): Promise<AiProjectDraft> {
        const currentDate = this.getVietnamDate();

        const systemPrompt = [
            'Bạn là bộ trích xuất dữ liệu dự án cho TaskFlow.',
            'Chỉ trích xuất thông tin dự án từ yêu cầu người dùng.',
            'Không nói rằng dự án đã được tạo.',
            `Ngày hiện tại tại Việt Nam là ${currentDate}.`,
            'Tính ngày tương đối dựa trên ngày hiện tại.',
            'Trả về một JSON object hợp lệ, không Markdown.',
            'Schema:',
            '{',
            '  "name": "string",',
            '  "description": "string hoặc null",',
            '  "status": "PLANNING | ACTIVE | ON_HOLD | COMPLETED | ARCHIVED",',
            '  "priority": "LOW | MEDIUM | HIGH | URGENT",',
            '  "startDate": "YYYY-MM-DD hoặc null",',
            '  "dueDate": "YYYY-MM-DD hoặc null"',
            '}',
            'Tên dự án là bắt buộc.',
            'Nếu người dùng không nêu status, trả về PLANNING.',
            'Nếu người dùng không nêu priority, trả về MEDIUM.',
            'Nếu người dùng không nêu ngày bắt đầu hoặc deadline, trả về null.',
            'Status chỉ thuộc enum Project, tuyệt đối không dùng TODO, IN_PROGRESS, REVIEW hoặc DONE.',
            'Priority chỉ được là LOW, MEDIUM, HIGH hoặc URGENT.',
            'Không trả về slug; backend tự tạo slug.',
            'Nếu người dùng nói ngày mai, hãy tính từ ngày hiện tại.',
            'Nếu người dùng nói sau N ngày kể từ ngày X, cộng N ngày vào ngày X.',
            'Không tự bịa tên dự án hoặc ngày tháng.',
        ].join('\n');

        return this.ollamaService.generateJson<AiProjectDraft>(
            message,
            systemPrompt,
            {
                num_predict: 256,
                num_ctx: 2048,
                temperature: 0,
            },
        );
    }

    private normalizeEnum<T extends string>(
        value: unknown,
        allowedValues: readonly T[],
        defaultValue: T,
    ): { valid: boolean; value: T } {
        // Giá trị không được cung cấp: dùng mặc định.
        if (value === null || value === undefined || value === '') {
            return {
                valid: true,
                value: defaultValue,
            };
        }

        if (typeof value !== 'string') {
            return {
                valid: false,
                value: defaultValue,
            };
        }

        const normalized = value.trim().toUpperCase();

        const matchedValue = allowedValues.find(
            (allowedValue) => allowedValue === normalized,
        );

        if (!matchedValue) {
            return {
                valid: false,
                value: defaultValue,
            };
        }

        return {
            valid: true,
            value: matchedValue,
        };
    }

    private normalizeDate(
        value: unknown,
    ): { valid: boolean; value?: string } {
        if (value === null || value === undefined || value === '') {
            return {
                valid: true,
                value: undefined,
            };
        }

        if (typeof value !== 'string') {
            return {
                valid: false,
            };
        }

        const date = value.trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return {
                valid: false,
            };
        }

        const [year, month, day] = date.split('-').map(Number);
        const parsed = new Date(Date.UTC(year, month - 1, day));

        const isRealDate =
            parsed.getUTCFullYear() === year &&
            parsed.getUTCMonth() === month - 1 &&
            parsed.getUTCDate() === day;

        if (!isRealDate) {
            return {
                valid: false,
            };
        }

        return {
            valid: true,
            value: date,
        };
    }

    private generateSlug(name: string): string {
        return name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 150)
            .replace(/-+$/g, '');
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
            return 'Chưa có deadline';
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
            const month = String(value.getUTCMonth() + 1).padStart(2, '0');
            const day = String(value.getUTCDate()).padStart(2, '0');

            dateString = `${year}-${month}-${day}`;
        }

        const [year, month, day] = dateString.split('-');

        return `${day}/${month}/${year}`;
    }
}
