import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomException } from './custom-exception';

@Catch(CustomException)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: CustomException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const message =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exception.message;

        response.status(status).json({
            success: false,
            expired: false,
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            code: exception.code,
        });
    }
}
