import { CustomExceptionFactory } from "../exception/custom-exception.factory";
import { ErrorCode } from "../exception/error-code";
import { PLATFORM_ENVIRONMENT, PlatformEnvironment } from "../types/platform.environment.type";

// eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type

declare global {
    interface EnvVar {
        READ_LOCAL_ENV?: 'true' | 'false';
        NODE_ENV: PlatformEnvironment;
    }

    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface ProcessEnv extends EnvVar { }
    }
}

export const isProd = () => {
    return process.env.NODE_ENV === PLATFORM_ENVIRONMENT.PROD;
};

export const isDev = () => {
    return process.env.NODE_ENV === PLATFORM_ENVIRONMENT.DEV;
};

export const isTest = () => {
    return process.env.NODE_ENV === PLATFORM_ENVIRONMENT.TEST;
};

export const getEnvVal = (env: keyof EnvVar, defaultVal?: string): string => {
    const envVal = process.env[env] as string | undefined;
    if (defaultVal === undefined) {
        if (!envVal) throw CustomExceptionFactory.create(ErrorCode.ENVIRONMENT_VARIABLE_NOT_DEFINED);
        
    }
    return (envVal ?? defaultVal) as string;
};

export const getNumericEnvVal = (
    env: keyof EnvVar,
    defaultVal?: number,
): number => {
    const envVal = process.env[env] as string | undefined;
    if (defaultVal === undefined) {
        if (envVal === undefined) {
            throw CustomExceptionFactory.create(ErrorCode.ENVIRONMENT_VARIABLE_NOT_DEFINED);
        }
        if (isNaN(Number(envVal))) {
            throw CustomExceptionFactory.create(ErrorCode.ENVIRONMENT_VARIABLE_NOT_DEFINED);
        }
    }
    return envVal ? Number(envVal) : defaultVal!;
};
