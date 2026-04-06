import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogArchiverService } from '../log-archive.service';

@Injectable()
export class HandleLogFilesSchedule {
    constructor(private logArchiverService: LogArchiverService) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    public async zipAndMoveLogFiles() {
        await this.logArchiverService.archiveOldLogFiles();
    }
}
