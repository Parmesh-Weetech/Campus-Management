import { MigrationInterface, QueryRunner } from "typeorm";

export class AttendanceSummaryView1773013000000 implements MigrationInterface {
    name = 'AttendanceSummaryView1773013000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE VIEW "attendance_summary_view" AS
            SELECT
                "studentId",
                "className",
                "month",
                "presentCount",
                "absentCount",
                "lateCount",
                "totalCount"
            FROM "attendance_summary_mv"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS "attendance_summary_view"`);
    }
}
