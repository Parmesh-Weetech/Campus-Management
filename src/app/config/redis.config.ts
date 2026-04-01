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

export const validateRedisConnection = async (config: RedisConfig): Promise<void> => {
    const redis = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
        connectTimeout: 5000,
        lazyConnect: true,
    });

    try {
        await redis.connect();
        await redis.ping();
        console.log('Successfully connected to Redis');
        await redis.disconnect();
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(' Redis connection failed:', error.message);
            throw new Error(`Redis connection failed: ${error.message}`);
        } else {
            console.error(' Redis connection failed:', error);
            throw new Error('Redis connection failed');
        }
    }
}