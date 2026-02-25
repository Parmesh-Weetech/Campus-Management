export const PLATFORM_ENVIRONMENT = {
    DEV: 'dev',
    PROD: 'prod',
    TEST: 'test',
};

export type PlatformEnvironment =
    (typeof PLATFORM_ENVIRONMENT)[keyof typeof PLATFORM_ENVIRONMENT];
