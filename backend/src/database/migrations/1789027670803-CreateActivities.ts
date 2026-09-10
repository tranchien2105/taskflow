import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActivities1789027670803 implements MigrationInterface {
    name = 'CreateActivities1789027670803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_invitations" DROP CONSTRAINT "FK_project_invitations_project"`);
        await queryRunner.query(`ALTER TABLE "project_invitations" DROP CONSTRAINT "FK_project_invitations_invited_user"`);
        await queryRunner.query(`ALTER TABLE "project_invitations" DROP CONSTRAINT "FK_project_invitations_invited_by_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_project_invitations_pending"`);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "user_id" uuid NOT NULL, "action" character varying(100) NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" uuid NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "project_invitations" ADD CONSTRAINT "FK_ff93e974f241ea13e6f7d5aa2d5" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_invitations" ADD CONSTRAINT "FK_e062ce7e8636d4a4dd713745afe" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_invitations" ADD CONSTRAINT "FK_5c6b1acac19aa1d1c14af2bfcac" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "project_invitations" DROP CONSTRAINT "FK_5c6b1acac19aa1d1c14af2bfcac"`);
        await queryRunner.query(`ALTER TABLE "project_invitations" DROP CONSTRAINT "FK_e062ce7e8636d4a4dd713745afe"`);
        await queryRunner.query(`ALTER TABLE "project_invitations" DROP CONSTRAINT "FK_ff93e974f241ea13e6f7d5aa2d5"`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_project_invitations_pending" ON "project_invitations" ("project_id", "invited_user_id") WHERE (status = 'PENDING'::project_invitations_status_enum)`);
        await queryRunner.query(`ALTER TABLE "project_invitations" ADD CONSTRAINT "FK_project_invitations_invited_by_user" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_invitations" ADD CONSTRAINT "FK_project_invitations_invited_user" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_invitations" ADD CONSTRAINT "FK_project_invitations_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
