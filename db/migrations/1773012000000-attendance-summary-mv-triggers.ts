import { MigrationInterface, QueryRunner } from "typeorm";

export class AttendanceSummaryMvTriggers1773012000000 implements MigrationInterface {
    name = 'AttendanceSummaryMvTriggers1773012000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION refresh_attendance_summary_mv()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                REFRESH MATERIALIZED VIEW "attendance_summary_mv";
                RETURN NULL;
            END;
            $$
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION refresh_attendance_summary_mv_on_update()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM new_rows n
                    JOIN old_rows o ON n.id = o.id
                    WHERE
                        n."deletedAt" IS DISTINCT FROM o."deletedAt"
                        OR n."date" IS DISTINCT FROM o."date"
                        OR n."className" IS DISTINCT FROM o."className"
                        OR n."status" IS DISTINCT FROM o."status"
                        OR n."studentId" IS DISTINCT FROM o."studentId"
                ) THEN
                    REFRESH MATERIALIZED VIEW "attendance_summary_mv";
                END IF;

                RETURN NULL;
            END;
            $$
        `);

        await queryRunner.query(`
            CREATE TRIGGER attendance_summary_mv_refresh_on_insert
            AFTER INSERT ON "attendance"
            FOR EACH STATEMENT
            EXECUTE FUNCTION refresh_attendance_summary_mv()
        `);

        await queryRunner.query(`
            CREATE TRIGGER attendance_summary_mv_refresh_on_delete
            AFTER DELETE ON "attendance"
            FOR EACH STATEMENT
            EXECUTE FUNCTION refresh_attendance_summary_mv()
        `);

        await queryRunner.query(`
            CREATE TRIGGER attendance_summary_mv_refresh_on_update
            AFTER UPDATE ON "attendance"
            REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
            FOR EACH STATEMENT
            EXECUTE FUNCTION refresh_attendance_summary_mv_on_update()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS attendance_summary_mv_refresh_on_update ON "attendance"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS attendance_summary_mv_refresh_on_delete ON "attendance"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS attendance_summary_mv_refresh_on_insert ON "attendance"`);

        await queryRunner.query(`DROP FUNCTION IF EXISTS refresh_attendance_summary_mv_on_update()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS refresh_attendance_summary_mv()`);
    }
}
