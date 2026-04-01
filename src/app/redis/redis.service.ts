import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CONNECTION } from './redis.constant';
import Redis from 'ioredis';
import { AttendanceCacheRecord, AttendanceListCacheParams } from './types/redis.type';

@Injectable()
export class RedisService {
    private readonly attendanceRecordIndexKey = 'attendance:index';
    private readonly attendanceRecordTtlInSeconds = 60 * 60 * 24;
    private readonly attendanceListQueryCachePrefix = 'attendance:list:query';
    private readonly attendanceListQueryCacheIndexKey = 'attendance:list:query:index';
    private readonly attendanceListQueryCacheTtlInSeconds = 60 * 60 * 12;

    constructor(@Inject(REDIS_CONNECTION) private readonly redisClient: Redis) { }

    getClient(): Redis {
        return this.redisClient;
    }

    buildEntityCacheKey(entity: string, id: string): string {
        return `${entity}:${id}`;
    }

    private getAttendanceScore(date: string): number {
        const parsedDate = new Date(date).getTime();
        return Number.isNaN(parsedDate) ? Date.now() : parsedDate;
    }

    async setJsonCache<T>(key: string, value: T, ttlInSeconds: number): Promise<void> {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
    }

    async getJsonCache<T>(key: string): Promise<T | null> {
        const cachedValue = await this.redisClient.get(key);

        if (!cachedValue) {
            return null;
        }

        return JSON.parse(cachedValue) as T;
    }

    async setAttendanceRecordCache(record: AttendanceCacheRecord): Promise<void> {
        const key = this.buildEntityCacheKey('attendance', record.id);
        const score = this.getAttendanceScore(record.date);

        await this.redisClient
            .multi()
            .set(key, JSON.stringify(record), 'EX', this.attendanceRecordTtlInSeconds)
            .zadd(this.attendanceRecordIndexKey, score, record.id)
            .expire(this.attendanceRecordIndexKey, this.attendanceRecordTtlInSeconds)
            .exec();
    }

    async deleteAttendanceRecordCache(attendanceId: string): Promise<void> {
        const key = this.buildEntityCacheKey('attendance', attendanceId);

        await this.redisClient
            .multi()
            .del(key)
            .zrem(this.attendanceRecordIndexKey, attendanceId)
            .exec();
    }

    buildAttendanceListQueryCacheKey(params: AttendanceListCacheParams): string {
        const className = params.className?.trim() ? params.className.trim().toLowerCase() : 'all';
        return [
            this.attendanceListQueryCachePrefix,
            `student=${params.studentId}`,
            `class=${className}`,
            `monthStart=${params.monthStart}`,
            `monthEnd=${params.monthEnd}`,
            `page=${params.page}`,
            `size=${params.size}`,
        ].join(':');
    }

    async setAttendanceListQueryCache<T>(key: string, value: T): Promise<void> {
        const score = Date.now();

        await this.redisClient
            .multi()
            .set(key, JSON.stringify(value), 'EX', this.attendanceListQueryCacheTtlInSeconds)
            .zadd(this.attendanceListQueryCacheIndexKey, score, key)
            .expire(this.attendanceListQueryCacheIndexKey, this.attendanceListQueryCacheTtlInSeconds)
            .exec();
    }

    async clearAttendanceListQueryCache(): Promise<void> {
        const cacheKeys = await this.redisClient.zrange(this.attendanceListQueryCacheIndexKey, 0, -1);

        if (!cacheKeys.length) {
            return;
        }

        await this.redisClient.del(...cacheKeys, this.attendanceListQueryCacheIndexKey);
    }

    // User caching methods
    async setUserCache(userId: string, name: string, email: string, userRole: string): Promise<void> {
        const key = this.buildEntityCacheKey('user', userId);
        await this.redisClient.hmset(key, { userId, name, email, userRole });
        await this.redisClient.expire(key, 60 * 60);
    }

    async getUserCache(userId: string): Promise<{ userId: string; name: string; email: string; userRole: string } | null> {
        const key = this.buildEntityCacheKey('user', userId);
        const data = await this.redisClient.hgetall(key);

        if (!data || !data.userId) {
            return null;
        }

        return {
            userId: data.userId,
            name: data.name,
            email: data.email,
            userRole: data.userRole
        };
    }
}
