import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { RedisModule } from '../../../redis/redis.module';

@Module({
  imports: [TerminusModule, RedisModule],
  controllers: [HealthController]
})
export class HealthModule {}
