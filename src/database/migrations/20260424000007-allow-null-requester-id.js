'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request ALTER COLUMN requester_id DROP NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request ALTER COLUMN requester_id SET NOT NULL;
    `);
  }
};
