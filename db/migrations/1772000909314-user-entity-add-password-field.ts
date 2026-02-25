import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntityAddPasswordField1772000909314 implements MigrationInterface {
    name = 'UserEntityAddPasswordField1772000909314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "password" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    }

}
