import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskIndexes1787299670325 implements MigrationInterface {
  name = 'AddTaskIndexes1787299670325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_assignee_id" ON "tasks" ("assignee_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_project_id" ON "tasks" ("project_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_project_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_assignee_id"`);
  }
}
