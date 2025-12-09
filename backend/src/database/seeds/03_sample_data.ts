import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('readings').del();
  await knex('meters').del();
  await knex('agents').del();
  await knex('addresses').del();
  await knex('clients').del();

  // Insert clients
  await knex('clients').insert([
    { first_name: 'Ahmed', last_name: 'BENALI', email: 'ahmed.benali@email.com', phone: '0612345678' },
    { first_name: 'Fatima', last_name: 'IDRISSI', email: 'fatima.idrissi@email.com', phone: '0623456789' },
    { first_name: 'Youssef', last_name: 'TAZI', email: 'youssef.tazi@email.com', phone: '0634567890' },
    { first_name: 'Khadija', last_name: 'FASSI', email: 'khadija.fassi@email.com', phone: '0645678901' },
    { first_name: 'Omar', last_name: 'BENJELLOUN', email: 'omar.benjelloun@email.com', phone: '0656789012' }
  ]);

  // Get district IDs
  const districts = await knex('districts').select('id', 'code');
  const districtMap = districts.reduce((acc, d) => ({ ...acc, [d.code]: d.id }), {} as Record<string, number>);

  // Insert agents
  await knex('agents').insert([
    { first_name: 'Ali', last_name: 'MOUHIB', personal_phone: '0612111111', professional_phone: '0537111111', district_id: districtMap['AGD'] },
    { first_name: 'Nadia', last_name: 'ZIANI', personal_phone: '0612222222', professional_phone: '0537222222', district_id: districtMap['AGD'] },
    { first_name: 'Rachid', last_name: 'AMRANI', personal_phone: '0612333333', professional_phone: '0537333333', district_id: districtMap['HSS'] },
    { first_name: 'Samira', last_name: 'FILALI', personal_phone: '0612444444', professional_phone: '0537444444', district_id: districtMap['SUI'] },
    { first_name: 'Hassan', last_name: 'ELIDRISSI', personal_phone: '0612555555', professional_phone: '0537555555', district_id: districtMap['YEM'] }
  ]);

  // Get client IDs
  const clients = await knex('clients').select('id');

  // Insert addresses
  await knex('addresses').insert([
    { street: 'Avenue Mohammed V', building_number: '12', district_id: districtMap['AGD'], client_id: clients[0].id, is_building: false },
    { street: 'Rue Al Amal', building_number: '45', district_id: districtMap['AGD'], client_id: clients[1].id, is_building: false },
    { street: 'Boulevard Hassan II', building_number: '78', district_id: districtMap['HSS'], client_id: clients[2].id, is_building: true },
    { street: 'Avenue Al Mansour', building_number: '23', district_id: districtMap['SUI'], client_id: clients[3].id, is_building: false },
    { street: 'Rue de la Liberté', building_number: '56', district_id: districtMap['YEM'], client_id: clients[4].id, is_building: false }
  ]);

  // Get address IDs
  const addresses = await knex('addresses').select('id');

  // Insert meters
  await knex('meters').insert([
    { id: '000000001', address_id: addresses[0].id, type: 'WATER', current_index: 1234.5, last_reading_date: new Date('2024-11-15') },
    { id: '000000002', address_id: addresses[0].id, type: 'ELECTRICITY', current_index: 5678.9, last_reading_date: new Date('2024-11-15') },
    { id: '000000003', address_id: addresses[1].id, type: 'WATER', current_index: 987.3, last_reading_date: new Date('2024-11-16') },
    { id: '000000004', address_id: addresses[1].id, type: 'ELECTRICITY', current_index: 4321.6, last_reading_date: new Date('2024-11-16') },
    { id: '000000005', address_id: addresses[2].id, type: 'WATER', current_index: 2468.1, last_reading_date: new Date('2024-11-17') },
    { id: '000000006', address_id: addresses[3].id, type: 'ELECTRICITY', current_index: 7890.2, last_reading_date: new Date('2024-11-18') },
    { id: '000000007', address_id: addresses[4].id, type: 'WATER', current_index: 1357.9, last_reading_date: new Date('2024-11-19') }
  ]);

  // Get agent IDs
  const agents = await knex('agents').select('id');

  // Insert readings
  await knex('readings').insert([
    { meter_id: '000000001', agent_id: agents[0].id, previous_index: 1200.0, new_index: 1234.5, consumption: 34.5, reading_date: new Date('2024-11-15 10:30:00') },
    { meter_id: '000000002', agent_id: agents[0].id, previous_index: 5600.0, new_index: 5678.9, consumption: 78.9, reading_date: new Date('2024-11-15 10:35:00') },
    { meter_id: '000000003', agent_id: agents[1].id, previous_index: 950.0, new_index: 987.3, consumption: 37.3, reading_date: new Date('2024-11-16 09:15:00') },
    { meter_id: '000000004', agent_id: agents[1].id, previous_index: 4250.0, new_index: 4321.6, consumption: 71.6, reading_date: new Date('2024-11-16 09:20:00') },
    { meter_id: '000000005', agent_id: agents[2].id, previous_index: 2400.0, new_index: 2468.1, consumption: 68.1, reading_date: new Date('2024-11-17 11:00:00') },
    { meter_id: '000000006', agent_id: agents[3].id, previous_index: 7800.0, new_index: 7890.2, consumption: 90.2, reading_date: new Date('2024-11-18 14:30:00') },
    { meter_id: '000000007', agent_id: agents[4].id, previous_index: 1320.0, new_index: 1357.9, consumption: 37.9, reading_date: new Date('2024-11-19 08:45:00') }
  ]);
}
