import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntityCreated1771998222280 implements MigrationInterface {
    name = 'UserEntityCreated1771998222280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'IS_NOT_ACTIVE')`);
        await queryRunner.query(`CREATE TYPE "public"."user_user_role_enum" AS ENUM('ADMIN', 'STUDENT', 'PROFESSOR')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone_number" character varying NOT NULL, "status" "public"."user_status_enum" NOT NULL, "user_role" "public"."user_user_role_enum" NOT NULL DEFAULT 'ADMIN', "profile_picture" character varying, "profile_picture_thumbnail" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_user_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
    }

}
