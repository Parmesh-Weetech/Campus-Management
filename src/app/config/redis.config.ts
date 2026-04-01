import { registerAs } from "@nestjs/config";
import { getEnvVal, getNumericEnvVal, getOptionalEnvVal } from "../common/helper";
import { RedisConfig } from "../common/types/redis.type";
import Redis from "ioredis";

declare global {
    interface EnvVar {
        REDIS_HOST: string;
        REDIS_PORT?: string;
        REDIS_PASSWORD?: string;
        REDIS_DB?: string;
    }
}

export const redisConfig = registerAs('redisConfig', () => {
    const config: RedisConfig = {
        host: getEnvVal('REDIS_HOST'),
        port: getNumericEnvVal('REDIS_PORT', 6379),
        password: getOptionalEnvVal('REDIS_PASSWORD'),
        db: getNumericEnvVal('REDIS_DB', 0),
    };

    return config;
});