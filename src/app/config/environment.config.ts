import { CustomExceptionFactory } from "../common/exception/custom-exception.factory";
import { ErrorCode } from "../common/exception/error-code";
import { getEnvVal } from "../common/helper";
import { PLATFORM_ENVIRONMENT } from "../common/types";

declare global {
    interface EnvVar {
        PORT: string;
    }
}

export const environmentConfig = () => {
    const environment = getEnvVal('NODE_ENV');
    if (!Object.values(PLATFORM_ENVIRONMENT).includes(environment)) {
        throw CustomExceptionFactory.create(ErrorCode.INVALID_NODE_ENV);
    }
    return {
        environment: environment,
        isProd: environment === 'prod',
        isDev: environment === 'dev',
        isTest: environment === 'test',
    };
};
