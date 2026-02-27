import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveStatusInvitedFromEnum1772174837042 implements MigrationInterface {
    name = 'RemoveStatusInvitedFromEnum1772174837042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"`
        );

        await queryRunner.query(
            `CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'IS_NOT_ACTIVE')`
        );

        await queryRunner.query(
            `UPDATE "user" SET "status" = 'ACTIVE' WHERE "status" = 'INVITED'`
        );

        await queryRunner.query(
            `ALTER TABLE "user"
            ALTER COLUMN "status"
            TYPE "public"."user_status_enum"
            USING "status"::text::"public"."user_status_enum"`
        );

        await queryRunner.query(
            `DROP TYPE "public"."user_status_enum_old"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"`
        );

        await queryRunner.query(
            `CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'IS_NOT_ACTIVE', 'INVITED')`
        );

        await queryRunner.query(
            `ALTER TABLE "user"
            ALTER COLUMN "status"
            TYPE "public"."user_status_enum"
            USING "status"::text::"public"."user_status_enum"`
        );

        await queryRunner.query(
            `DROP TYPE "public"."user_status_enum_old"`
        );
    }

}
