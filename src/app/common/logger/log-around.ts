import { logger } from './logger';
import { Request, Response } from 'express';

const lastLogTime = new Map<string, number>();

function safeStringify(obj: unknown): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
        }
        return value;
    });
}

export const LogAround = (options?: {
    ignoreArgs?: boolean;
    ignoreReturn?: boolean;
    preventRepeatMs?: number;
}) => {
    const preventRepeatMs = options?.preventRepeatMs ?? 100;

    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const className = this?.constructor?.name || 'unknown';
            const key = `${className}.${propertyKey}`;

            const now = Date.now();
            const lastTime = lastLogTime.get(key) || 0;
            const isInLoop = now - lastTime < preventRepeatMs;
            lastLogTime.set(key, now);

            const req: Request | undefined = args.find(a => a?.method && a?.url) as Request;
            const res: Response | undefined = args.find(a => a?.statusCode !== undefined) as Response;

            const endpoint = req ? `[${req.method} ${req.url}]` : `[${className}.${propertyKey}]`;

            const baseLog = {
                class: className,
                method: propertyKey,
                endpoint,
                args: !options?.ignoreArgs ? args : undefined,
                duration: 0, // placeholder, will update after method runs
            };

            const startTime = Date.now();

            try {
                const result = await originalMethod.apply(this, args);
                const duration = Date.now() - startTime;

                if (!isInLoop) {
                    const logEntry = {
                        ...baseLog,
                        message: 'Success',
                        return: !options?.ignoreReturn ? result : undefined,
                        duration: `${duration}ms`,
                        level: 'info',
                    };
                    logger.log(logEntry);
                }

                if (req && res && !isInLoop) {
                    const httpLog = {
                        ...baseLog,
                        message: 'HTTP Response',
                        statusCode: res.statusCode,
                        duration: `${Date.now() - startTime}ms`,
                        level: res.statusCode >= 400 ? 'error' : 'info',
                    };
                    logger.log(httpLog.level, httpLog);
                }

                return result;
            } catch (error: unknown) {
                const duration = Date.now() - startTime;
                const errMessage = (error as Error).message;

                if (!isInLoop) {
                    const logEntry = {
                        ...baseLog,
                        message: errMessage,
                        level: 'error',
                        duration: `${duration}ms`,
                    };
                    logger.error(logEntry);
                }

                throw error;
            }
        };

        return descriptor;
    };
};