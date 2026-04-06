import {
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { logger } from '../../common/logger/logger';

interface SafeBody {
    body: unknown;
    truncated: boolean;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly MAX_BODY_LENGTH = 10_000;

    private readonly SENSITIVE_KEYS = new Set([
        'password',
        'newPassword',
        'oldPassword',
        'confirmPassword',
        'token',
        'accessToken',
        'refreshToken',
        'secret',
        'authorization',
    ]);

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const safeBody = this.safeSerialize(request.body);
        const startTime = process.hrtime.bigint();
        const method = request.method;
        const url = request.originalUrl || request.url;

        logger.log({
            level: 'info',
            type: 'http_request',
            hostname: request.hostname,
            method,
            url,
            ip: request.ip,
            body: safeBody.body,
            bodyTruncated: safeBody.truncated,
        });

        return next.handle().pipe(
            tap(() => {
                logger.log({
                    level: 'info',
                    type: 'http_success',
                    hostname: request.hostname,
                    method,
                    url,
                    statusCode: response.statusCode,
                    durationMs: this.getDurationMs(startTime),
                });
            }),
            catchError((error: unknown) => {
                logger.error({
                    level: 'error',
                    type: 'http_error',
                    hostname: request.hostname,
                    method,
                    url,
                    statusCode: this.getStatusCode(error, response),
                    durationMs: this.getDurationMs(startTime),
                    errorMessage: this.getErrorMessage(error),
                    errorStack: this.getErrorStack(error),
                });

                return throwError(() => error);
            }),
        );
    }

    private safeSerialize(input: unknown): SafeBody {
        const redacted = this.redactSensitiveFields(input);

        try {
            const raw = JSON.stringify(redacted);

            if (raw.length <= this.MAX_BODY_LENGTH) {
                return { body: redacted, truncated: false };
            }

            return {
                body: '[TRUNCATED_BODY_TOO_LARGE]',
                truncated: true,
            };
        } catch {
            return {
                body: '[UNSERIALIZABLE_BODY]',
                truncated: false,
            };
        }
    }

    private redactSensitiveFields(input: unknown): unknown {
        if (Array.isArray(input)) {
            return input.map((item) => this.redactSensitiveFields(item));
        }

        if (!input || typeof input !== 'object') {
            return input;
        }

        const seen = new WeakSet<object>();

        const walk = (value: unknown): unknown => {
            if (Array.isArray(value)) {
                return value.map((item) => walk(item));
            }

            if (!value || typeof value !== 'object') {
                return value;
            }

            if (seen.has(value as object)) {
                return '[Circular]';
            }

            seen.add(value as object);

            return Object.fromEntries(
                Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
                    key,
                    this.SENSITIVE_KEYS.has(key.toLowerCase())
                        ? '[REDACTED]'
                        : walk(nestedValue),
                ]),
            );
        };

        return walk(input);
    }

    private getDurationMs(startTime: bigint): number {
        const end = process.hrtime.bigint();
        return Number(end - startTime) / 1_000_000;
    }

    private getStatusCode(error: unknown, response: Response): number {
        if (error instanceof HttpException) {
            return error.getStatus();
        }

        if (
            error &&
            typeof error === 'object' &&
            'statusCode' in error &&
            typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ) {
            return (error as { statusCode: number }).statusCode;
        }

        return response.statusCode || 500;
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        try {
            return JSON.stringify(error);
        } catch {
            return '[UNSERIALIZABLE_ERROR]';
        }
    }

    private getErrorStack(error: unknown): string | undefined {
        if (error instanceof Error) {
            return error.stack;
        }

        return undefined;
    }
}
