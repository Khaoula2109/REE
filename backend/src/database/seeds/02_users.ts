import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();

  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  await knex('users').insert([
    {
      last_name: 'ADMIN',
      first_name: 'Super',
      email: 'admin@ree.ma',
      password: hashedPassword,
      role: 'SUPERADMIN',
      must_change_password: false
    },
    {
      last_name: 'ALAOUI',
      first_name: 'Mohammed',
      email: 'malaoui@ree.ma',
      password: hashedPassword,
      role: 'USER',
      must_change_password: false
    }
  ]);
}
