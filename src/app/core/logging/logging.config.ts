import { registerAs } from '@nestjs/config';
import { getEnvVal } from '../../common/helper/env';

declare global {
    interface EnvVar {
        ARCHIVE_LOGS_FILE_AFTER_DAYS?: string;
        LOGS_ARCHIVE_DIR_PATH?: string;
    }
}

export const loggingConfig = registerAs('logging', () => ({
    archiveLogsFileAfterDays: Number(
        getEnvVal('ARCHIVE_LOGS_FILE_AFTER_DAYS', '2'),
    ),
    logsArchiveDirPath: getEnvVal('LOGS_ARCHIVE_DIR_PATH', 'logs/archive'),
}));
