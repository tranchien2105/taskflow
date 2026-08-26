import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = (
          exceptionResponse as {
            message: string | string[];
          }
        ).message;
      }
    } else if (this.isPostgresUniqueViolation(exception)) {
      status = HttpStatus.CONFLICT;
      message = 'Resource already exists';
    }

    this.logException(exception, status, request, requestId);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }

  private logException(
    exception: unknown,
    status: number,
    request: Request,
    requestId?: string,
  ) {
    const message =
      exception instanceof Error ? exception.message : String(exception);

    const logMessage = `[${requestId}] ${request.method} ${request.url} ${status} - ${message}`;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;

      this.logger.error(logMessage, stack);
      return;
    }

    this.logger.warn(logMessage);
  }

  private isPostgresUniqueViolation(exception: unknown): boolean {
    if (typeof exception !== 'object' || exception === null) {
      return false;
    }

    if (
      'code' in exception &&
      (exception as { code?: string }).code === '23505'
    ) {
      return true;
    }

    if ('driverError' in exception) {
      const driverError = (
        exception as {
          driverError?: {
            code?: string;
          };
        }
      ).driverError;

      return driverError?.code === '23505';
    }

    return false;
  }
}
