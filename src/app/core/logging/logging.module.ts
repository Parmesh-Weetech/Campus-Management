import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { loggingConfig } from './logging.config';
import { LoggingInterceptor } from './logger.interceptor';
import { LogArchiverService } from './log-archive.service';
import { HandleLogFilesSchedule } from './scheduled-tasks/manage-old-files.schedule';

@Global()
@Module({
    imports: [ConfigModule.forFeature(loggingConfig)],
    providers: [
        LogArchiverService,
        HandleLogFilesSchedule,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor,
        },
    ],
    exports: [LogArchiverService],
})
export class LoggingModule {}
