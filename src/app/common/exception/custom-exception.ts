import { HttpException } from '@nestjs/common';
import { ErrorCode } from './error-code';

export class CustomException extends HttpException {
    readonly code: ErrorCode;

    constructor(
        response: string | Record<string, unknown>,
        status: number,
        code: ErrorCode,
    ) {
        super(response, status);
        this.code = code;
    }
}
