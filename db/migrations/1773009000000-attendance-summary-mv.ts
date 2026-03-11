import { MigrationInterface, QueryRunner } from "typeorm";

export class AttendanceSummaryMv1773009000000 implements MigrationInterface {
    name = 'AttendanceSummaryMv1773009000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW "attendance_summary_mv" AS
            SELECT
                "studentId",
                "className",
                date_trunc('month', "date")::date AS "month",
                count(*) FILTER (WHERE status = 'PRESENT') AS "presentCount",
                count(*) FILTER (WHERE status = 'ABSENT') AS "absentCount",
                count(*) FILTER (WHERE status = 'LATE') AS "lateCount",
                count(*) AS "totalCount"
            FROM "attendance"
            WHERE "deletedAt" IS NULL
            GROUP BY 1, 2, 3
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "attendance_summary_mv_uq"
            ON "attendance_summary_mv" ("studentId", "className", "month")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "attendance_summary_mv_uq"`);
        await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "attendance_summary_mv"`);
    }
}
