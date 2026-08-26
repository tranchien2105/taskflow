import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLabels1787202217000 implements MigrationInterface {
  name = 'CreateLabels1787202217000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "color" character varying(7) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4ad2fb06c904bbfed6510589b2b" UNIQUE ("project_id", "name"), CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_68b0da461f6765824f6db642f12" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_68b0da461f6765824f6db642f12"`,
    );
    await queryRunner.query(`DROP TABLE "labels"`);
  }
}
