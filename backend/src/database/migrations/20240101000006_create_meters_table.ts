import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('meters', (table) => {
    table.string('id', 9).primary(); // 9-digit meter ID with leading zeros
    table.integer('address_id').unsigned().notNullable();
    table.enum('type', ['WATER', 'ELECTRICITY']).notNullable();
    table.decimal('current_index', 10, 2).defaultTo(0);
    table.timestamp('last_reading_date');
    table.timestamps(true, true);

    table.foreign('address_id').references('id').inTable('addresses').onDelete('RESTRICT');

    table.unique(['address_id', 'type']); // One water and one electricity meter per address
    table.index('address_id');
    table.index('type');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('meters');
}
