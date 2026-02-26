import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueKeyCombinationOfStudentDateClassName1772097718625 implements MigrationInterface {
    name = 'UniqueKeyCombinationOfStudentDateClassName1772097718625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "UQ_82a731146b730255092a3033724" UNIQUE ("student_id", "date", "className")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "UQ_82a731146b730255092a3033724"`);
    }

}
