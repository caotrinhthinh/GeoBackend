'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE emergency_request
        ADD COLUMN IF NOT EXISTS session_token UUID;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_session_token
        ON emergency_request(session_token)
        WHERE session_token IS NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_emergency_session_token;
      ALTER TABLE emergency_request DROP COLUMN IF EXISTS session_token;
    `);
  },
};
