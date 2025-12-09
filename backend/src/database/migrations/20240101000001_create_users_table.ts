import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('last_name', 100).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.enum('role', ['SUPERADMIN', 'USER']).notNullable().defaultTo('USER');
    table.boolean('must_change_password').defaultTo(false);
    table.timestamps(true, true);

    table.index('email');
    table.index('role');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}
