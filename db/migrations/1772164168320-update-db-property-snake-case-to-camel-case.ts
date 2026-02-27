import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDbPropertySnakeCaseToCamelCase1772164168320 implements MigrationInterface {
    name = 'UpdateDbPropertySnakeCaseToCamelCase1772164168320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "student_id" TO "studentId"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "recorded_by_id" TO "recordedById"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "created_at" TO "createdAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "updated_at" TO "updatedAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "deleted_at" TO "deletedAt"`
        );

        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "created_at" TO "createdAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "updated_at" TO "updatedAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "deleted_at" TO "deletedAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "phone_number" TO "phoneNumber"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "profile_picture_thumbnail" TO "profilePictureThumbnail"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "profile_picture" TO "profilePicture"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "user_role" TO "userRole"`
        );

        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "refresh_token" TO "refreshToken"`
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "created_at" TO "createdAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "updated_at" TO "updatedAt"`
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "deleted_at" TO "deletedAt"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "deletedAt" TO "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "updatedAt" TO "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "createdAt" TO "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME COLUMN "refreshToken" TO "refresh_token"`
        );

        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "profilePicture" TO "profile_picture"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "profilePictureThumbnail" TO "profile_picture_thumbnail"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "phoneNumber" TO "phone_number"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "deletedAt" TO "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "updatedAt" TO "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "createdAt" TO "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "user" RENAME COLUMN "userRole" TO "user_role"`
        );

        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "deletedAt" TO "deleted_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "updatedAt" TO "updated_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "createdAt" TO "created_at"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "recordedById" TO "recorded_by_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "attendance" RENAME COLUMN "studentId" TO "student_id"`
        );
    }

}
