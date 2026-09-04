import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1788490600513 implements MigrationInterface {
    name = 'CreateNotifications1788490600513';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum"
            AS ENUM(
                'TASK_ASSIGNED',
                'TASK_UNASSIGNED',
                'PROJECT_MEMBER_ADDED',
                'PROJECT_MEMBER_REMOVED',
                'PROJECT_ROLE_CHANGED',
                'PROJECT_DELETED'
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL,
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "entity_type" character varying,
                "entity_id" uuid,
                "is_read" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a"
                    PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);

        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum"
        `);
    }
}