import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('readings', (table) => {
    table.increments('id').primary();
    table.string('meter_id', 9).notNullable();
    table.integer('agent_id').unsigned().notNullable();
    table.decimal('previous_index', 10, 2).notNullable();
    table.decimal('new_index', 10, 2).notNullable();
    table.decimal('consumption', 10, 2).notNullable();
    table.timestamp('reading_date').notNullable();
    table.timestamps(true, true);

    table.foreign('meter_id').references('id').inTable('meters').onDelete('RESTRICT');
    table.foreign('agent_id').references('id').inTable('agents').onDelete('RESTRICT');

    table.index('meter_id');
    table.index('agent_id');
    table.index('reading_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('readings');
}
