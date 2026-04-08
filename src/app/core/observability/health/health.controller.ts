import { DiskHealthIndicator, HealthCheckService, HealthIndicatorService, MemoryHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '../../../auth/decorators/public.decorator';
import { RedisService } from '../../../redis/redis.service';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {

    constructor(
        private readonly health: HealthCheckService,
        private readonly db: TypeOrmHealthIndicator,
        private readonly redis: RedisService,
        private readonly healthIndicator: HealthIndicatorService,
        private readonly memory: MemoryHealthIndicator,
        private readonly disk: DiskHealthIndicator,
    ) {

    }
    @Get()
    @Public()
    async getHealth() {
        return this.health.check([
            async () => this.db.pingCheck('postgres'),
            async () => {
                const client = this.redis.getClient();
                await client.ping();

                return this.healthIndicator.check('redis').up();
            },
            async () => this.healthIndicator.check('backend').up(),
            async () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
            async () => this.disk.checkStorage('disk', { thresholdPercent: 0.5, path: '/' }),
        ]);
    }
}
