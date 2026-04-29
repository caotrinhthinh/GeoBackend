'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request
        ADD COLUMN IF NOT EXISTS route_geometry JSONB,
        ADD COLUMN IF NOT EXISTS eta_seconds    INTEGER;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request
        DROP COLUMN IF EXISTS route_geometry,
        DROP COLUMN IF EXISTS eta_seconds;
    `);
  },
};
