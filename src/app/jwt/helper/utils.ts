import { CustomExceptionFactory } from "../../common/exception/custom-exception.factory";
import { ErrorCode } from "../../common/exception/error-code";

export const convertIntoNumber = (value: string) => {
    return Number(value);
}

export function convertToSeconds(time: string): number {
    const unit = time.slice(-1);
    const value = parseInt(time.slice(0, -1));
    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: throw CustomExceptionFactory.create(ErrorCode.INVALID_TIME_UNIT)
    }
}