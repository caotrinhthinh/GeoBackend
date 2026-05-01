'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request
        ADD COLUMN IF NOT EXISTS done_at TIMESTAMP;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request
        DROP COLUMN IF EXISTS done_at;
    `);
  },
};

