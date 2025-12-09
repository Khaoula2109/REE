import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('districts', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('code', 20).notNullable().unique();
    table.timestamps(true, true);

    table.index('code');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('districts');
}
