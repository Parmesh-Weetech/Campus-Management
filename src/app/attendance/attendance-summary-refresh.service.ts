import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DataSource } from "typeorm";

@Injectable()
export class AttendanceSummaryRefreshService {
    private readonly logger = new Logger(AttendanceSummaryRefreshService.name);

    @Cron(process.env.ATTENDANCE_SUMMARY_REFRESH_CRON ?? '0 */6 * * *')
    async refreshSummaryView(): Promise<void> {
        if (process.env.NODE_ENV === 'test') return;

        try {
            await this.dataSource.query(
                `REFRESH MATERIALIZED VIEW CONCURRENTLY "attendance_summary_mv"`
            );
            console.log("Attendance summary materialized view refreshed.")
            this.logger.log('Attendance summary materialized view refreshed.');
        } catch (error) {
            console.log('Failed to refresh attendance summary materialized view.');
            this.logger.error('Failed to refresh attendance summary materialized view.', error);
        }
    }

    constructor(private readonly dataSource: DataSource) { }
}
