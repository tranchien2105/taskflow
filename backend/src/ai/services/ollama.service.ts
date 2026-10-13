
import {
    BadGatewayException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaResponse {
    message?: {
        role: string;
        content: string;
        thinking?: string;
    };
}

interface OllamaOptions {
    num_predict?: number;
    num_ctx?: number;
    temperature?: number;
}

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);

    constructor(private readonly configService: ConfigService) {}

    async chat(
        message: string,
        systemPrompt: string,
        options: OllamaOptions = {},
    ): Promise<string> {
        const content = await this.request(
            message,
            systemPrompt,
            options,
        );

        if (!content) {
            throw new BadGatewayException(
                'AI returned an empty response',
            );
        }

        return content;
    }

    async generateJson<T>(
        message: string,
        systemPrompt: string,
        options: OllamaOptions = {},
    ): Promise<T> {
        const content = await this.request(
            message,
            systemPrompt,
            {
                num_predict: 256,
                num_ctx: 2048,
                temperature: 0,
                ...options,
            },
            'json',
        );

        try {
            const parsed: unknown = JSON.parse(content);

            if (
                typeof parsed !== 'object' ||
                parsed === null ||
                Array.isArray(parsed)
            ) {
                throw new Error('Expected a JSON object');
            }

            return parsed as T;
        } catch (error: unknown) {
            const detail =
                error instanceof Error
                    ? error.message
                    : String(error);

            this.logger.warn(
                `Invalid JSON returned by Ollama: ${detail}`,
            );

            throw new BadGatewayException(
                'AI không trả về dữ liệu JSON hợp lệ.',
            );
        }
    }

    private async request(
        message: string,
        systemPrompt: string,
        options: OllamaOptions = {},
        format?: 'json',
    ): Promise<string> {
        const baseUrl = this.configService
            .get<string>(
                'OLLAMA_BASE_URL',
                'http://host.docker.internal:11434',
            )
            .replace(/\/+$/, '');

        const model = this.configService.get<string>(
            'OLLAMA_MODEL',
            'qwen3:1.7b',
        );

        try {
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    stream: false,
                    think: false,
                    keep_alive: '10m',
                    ...(format ? { format } : {}),
                    options: {
                        num_predict: 128,
                        num_ctx: 2048,
                        temperature: 0.2,
                        ...options,
                    },
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt,
                        },
                        {
                            role: 'user',
                            content: message,
                        },
                    ],
                }),
                signal: AbortSignal.timeout(120_000),
            });

            if (!response.ok) {
                this.logger.warn(
                    `Ollama returned HTTP ${response.status}`,
                );

                throw new BadGatewayException(
                    'AI provider request failed',
                );
            }

            const result =
                (await response.json()) as OllamaResponse;

            const content = result.message?.content?.trim();

            if (!content) {
                throw new BadGatewayException(
                    'AI returned an empty response',
                );
            }

            return content;
        } catch (error: unknown) {
            if (error instanceof BadGatewayException) {
                throw error;
            }

            const detail =
                error instanceof Error
                    ? error.message
                    : String(error);

            this.logger.error(`Ollama request failed: ${detail}`);

            throw new BadGatewayException(
                'AI phản hồi quá lâu hoặc không thể kết nối. Vui lòng thử lại.',
            );
        }
    }
}
