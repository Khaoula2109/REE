import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('addresses', (table) => {
    table.increments('id').primary();
    table.string('street', 255).notNullable();
    table.string('building_number', 50).notNullable();
    table.integer('district_id').unsigned().notNullable();
    table.integer('client_id').unsigned().notNullable();
    table.boolean('is_building').defaultTo(false);
    table.timestamps(true, true);

    table.foreign('district_id').references('id').inTable('districts').onDelete('RESTRICT');
    table.foreign('client_id').references('id').inTable('clients').onDelete('RESTRICT');

    table.index('district_id');
    table.index('client_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('addresses');
}
