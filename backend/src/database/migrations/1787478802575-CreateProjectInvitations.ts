import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
    TableIndex,
} from 'typeorm';

export class CreateProjectInvitations1787478802575
    implements MigrationInterface
{
    name = 'CreateProjectInvitations1787478802575';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."project_invitations_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`,
        );

        await queryRunner.query(
            `CREATE TABLE "project_invitations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "project_id" uuid NOT NULL,
                "invited_user_id" uuid NOT NULL,
                "invited_by_user_id" uuid NOT NULL,
                "status" "public"."project_invitations_status_enum" NOT NULL DEFAULT 'PENDING',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_project_invitations_id"
                    PRIMARY KEY ("id")
            )`,
        );

        await queryRunner.createForeignKeys(
            'project_invitations',
            [
                new TableForeignKey({
                    name: 'FK_project_invitations_project',
                    columnNames: ['project_id'],
                    referencedTableName: 'projects',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),

                new TableForeignKey({
                    name: 'FK_project_invitations_invited_user',
                    columnNames: ['invited_user_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),

                new TableForeignKey({
                    name: 'FK_project_invitations_invited_by_user',
                    columnNames: ['invited_by_user_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            ],
        );

        await queryRunner.createIndex(
            'project_invitations',
            new TableIndex({
                name: 'IDX_project_invitations_pending',
                columnNames: [
                    'project_id',
                    'invited_user_id',
                ],
                isUnique: true,
                where: `"status" = 'PENDING'`,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex(
            'project_invitations',
            'IDX_project_invitations_pending',
        );

        await queryRunner.dropForeignKey(
            'project_invitations',
            'FK_project_invitations_invited_by_user',
        );

        await queryRunner.dropForeignKey(
            'project_invitations',
            'FK_project_invitations_invited_user',
        );

        await queryRunner.dropForeignKey(
            'project_invitations',
            'FK_project_invitations_project',
        );

        await queryRunner.query(
            `DROP TABLE "project_invitations"`,
        );

        await queryRunner.query(
            `DROP TYPE "public"."project_invitations_status_enum"`,
        );
    }
}