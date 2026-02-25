import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntityMakeThumbnailFieldNullableTrue1771999812927 implements MigrationInterface {
    name = 'UserEntityMakeThumbnailFieldNullableTrue1771999812927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "profile_picture_thumbnail" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "profile_picture_thumbnail" SET NOT NULL`);
    }

}
