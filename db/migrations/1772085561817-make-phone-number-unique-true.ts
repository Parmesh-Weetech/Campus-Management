import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePhoneNumberUniqueTrue1772085561817 implements MigrationInterface {
    name = 'MakePhoneNumberUniqueTrue1772085561817'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_01eea41349b6c9275aec646eee0" UNIQUE ("phone_number")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_01eea41349b6c9275aec646eee0"`);
    }

}
