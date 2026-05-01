'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const superAdminPasswordHash = await bcrypt.hash('admin123', 12);
        const hospitalAdminPasswordHash = await bcrypt.hash('adminbv123', 12);

        await queryInterface.sequelize.query(`
      INSERT INTO users (email, password_hash, role_id, facility_id, is_active)
      VALUES
        ('admin@geobackend.com', '${superAdminPasswordHash}', 1, NULL, true),
        (
          'hospital.admin@geobackend.com',
          '${hospitalAdminPasswordHash}',
          2,
          (SELECT id FROM medical_facility WHERE type = 'hospital' ORDER BY id ASC LIMIT 1),
          true
        )
      ON CONFLICT (email) DO NOTHING;
    `);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
      DELETE FROM users
      WHERE email IN ('admin@geobackend.com', 'hospital.admin@geobackend.com');
    `);
    },
};
