'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request
      ADD COLUMN IF NOT EXISTS requester_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS requester_blood_type TEXT,
      ADD COLUMN IF NOT EXISTS requester_allergies TEXT,
      ADD COLUMN IF NOT EXISTS requester_chronic_conditions TEXT,
      ADD COLUMN IF NOT EXISTS requester_age INTEGER,
      ADD COLUMN IF NOT EXISTS requester_emergency_contact_phone VARCHAR(20);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request
      DROP COLUMN IF EXISTS requester_name,
      DROP COLUMN IF EXISTS requester_blood_type,
      DROP COLUMN IF EXISTS requester_allergies,
      DROP COLUMN IF EXISTS requester_chronic_conditions,
      DROP COLUMN IF EXISTS requester_age,
      DROP COLUMN IF EXISTS requester_emergency_contact_phone;
    `);
  },
};
