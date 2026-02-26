import { LogAround } from '../logger/log-around';
import { CustomException } from './custom-exception';
import { defaultErrorMessages } from './default-error-message';
import { ErrorCode } from './error-code';

export class CustomExceptionFactory {
    @LogAround({ ignoreArgs: true, ignoreReturn: true })
    public static create(
        code: ErrorCode,
        message?: string,
        statusCode?: number,
    ): CustomException {
        return new CustomException(
            message ?? defaultErrorMessages[code].message,
            statusCode ?? defaultErrorMessages[code].statusCode,
            code,
        );
    }
}
