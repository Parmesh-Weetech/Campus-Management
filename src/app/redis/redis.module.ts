import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigType } from '@nestjs/config';
import { redisConfig } from '../config/redis.config';
import { REDIS_CONNECTION } from './redis.constant';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CONNECTION,
      useFactory: async (config: ConfigType<typeof redisConfig>) => {
        const redis = new Redis({
          host: config.host,
          port: config.port,
          password: config.password,
          db: config.db,
        });

        try {
          await redis.ping();
          console.log('Successfully connected to Redis');
          return redis;
        } catch (error) {
          console.error('Failed to establish Redis connection:', error);
          await redis.disconnect();
          throw error;
        }
      },
      inject: [redisConfig.KEY],
    },
    RedisService],
  exports: [
    RedisService,
    REDIS_CONNECTION
  ]
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CONNECTION) private readonly redisClient: Redis) { }

  async onModuleDestroy() {
    await this.redisClient.disconnect();
  }
}
