import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexToRefreshTokenTable1775467254540 implements MigrationInterface {
    name = 'IndexToRefreshTokenTable1775467254540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_17bb15a4c1188987b0e9d7bc33b"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "UQ_82a731146b730255092a3033724"`);
        await queryRunner.query(`ALTER TYPE "public"."user_user_role_enum" RENAME TO "user_user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_userrole_enum" AS ENUM('ADMIN', 'STUDENT', 'PROFESSOR')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "userRole" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "userRole" TYPE "public"."user_userrole_enum" USING "userRole"::"text"::"public"."user_userrole_enum"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "userRole" SET DEFAULT 'ADMIN'`);
        await queryRunner.query(`DROP TYPE "public"."user_user_role_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_428e14ded7299edfcf58918bea" ON "refresh_token" ("refreshToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_8e913e288156c133999341156a" ON "refresh_token" ("userId") `);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "UQ_8abecbb7afa67578457b4684444" UNIQUE ("studentId", "date", "className")`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_120e1c6edcec4f8221f467c8039" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_7c03b4a42be7f5e5ecca028f798" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_7c03b4a42be7f5e5ecca028f798"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_120e1c6edcec4f8221f467c8039"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "UQ_8abecbb7afa67578457b4684444"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e913e288156c133999341156a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_428e14ded7299edfcf58918bea"`);
        await queryRunner.query(`CREATE TYPE "public"."user_user_role_enum_old" AS ENUM('ADMIN', 'STUDENT', 'PROFESSOR')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "userRole" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "userRole" TYPE "public"."user_user_role_enum_old" USING "userRole"::"text"::"public"."user_user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "userRole" SET DEFAULT 'ADMIN'`);
        await queryRunner.query(`DROP TYPE "public"."user_userrole_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_user_role_enum_old" RENAME TO "user_user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "UQ_82a731146b730255092a3033724" UNIQUE ("date", "className", "studentId")`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_17bb15a4c1188987b0e9d7bc33b" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
