import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('agents', (table) => {
    table.increments('id').primary();
    table.string('last_name', 100).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('personal_phone', 20).notNullable();
    table.string('professional_phone', 20);
    table.integer('district_id').unsigned().notNullable();
    table.timestamps(true, true);

    table.foreign('district_id').references('id').inTable('districts').onDelete('RESTRICT');

    table.index('district_id');
    table.index('last_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('agents');
}
