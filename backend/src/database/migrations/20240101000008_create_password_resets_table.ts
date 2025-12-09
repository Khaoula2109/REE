import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable();
    table.string('token', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamps(true, true);

    table.index('email');
    table.index('token');
    table.index('expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('password_resets');
}
