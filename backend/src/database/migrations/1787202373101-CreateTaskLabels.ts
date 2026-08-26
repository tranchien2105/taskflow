import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskLabels1787202373101 implements MigrationInterface {
  name = 'CreateTaskLabels1787202373101';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "task_labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "label_id" uuid NOT NULL, CONSTRAINT "UQ_d46d4e476e3f6f8bf272b2bc1eb" UNIQUE ("task_id", "label_id"), CONSTRAINT "PK_72402f2c22ceabc2e73b718c321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_844df22351eb86c33c3e8c132f4" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_09dd3f6f9d04063726c498155f2" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_09dd3f6f9d04063726c498155f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_844df22351eb86c33c3e8c132f4"`,
    );
    await queryRunner.query(`DROP TABLE "task_labels"`);
  }
}
