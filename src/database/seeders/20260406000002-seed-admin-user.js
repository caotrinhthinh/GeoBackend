'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Generate '$2a$12$...' hash for 'admin123'
    const passwordHash = await bcrypt.hash('admin123', 12);

    await queryInterface.sequelize.query(`
      INSERT INTO users (email, password_hash, role_id, is_active)
      VALUES ('admin@geobackend.local', '${passwordHash}', 1, true)
      ON CONFLICT DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE email = 'admin@geobackend.local';
    `);
  }
};
