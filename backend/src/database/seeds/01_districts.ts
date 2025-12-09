import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('districts').del();

  await knex('districts').insert([
    { name: 'Agdal', code: 'AGD' },
    { name: 'Hassan', code: 'HSS' },
    { name: 'Souissi', code: 'SUI' },
    { name: 'Yacoub El Mansour', code: 'YEM' },
    { name: 'Hay Riad', code: 'HRD' },
    { name: 'Océan', code: 'OCN' },
    { name: 'Touarga', code: 'TRG' },
    { name: 'Aviation', code: 'AVT' }
  ]);
}
