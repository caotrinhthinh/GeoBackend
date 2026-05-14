'use strict';
const bcrypt = require('bcryptjs');

/**
 * Dev seed accounts (không dùng production).
 *
 * Quy ước admin trực ban (role_id = 2):
 *   Email:    admin.{slug}@geobackend.com   (slug ASCII, gắn với tên BV trong seed)
 *   Mật khẩu: BvAdmin123                    (chung cho mọi tài khoản BV seed)
 *
 * SuperAdmin giữ: admin@geobackend.com / admin123
 */
const HOSPITAL_ADMIN_ROWS = [
    { email: 'admin.cho-ray@geobackend.com', hospitalOffset: 0 },
    { email: 'admin.nhan-dan-115@geobackend.com', hospitalOffset: 1 },
    { email: 'admin.dh-y-duoc@geobackend.com', hospitalOffset: 2 },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const superAdminPasswordHash = await bcrypt.hash('admin123', 12);
        const hospitalAdminPasswordHash = await bcrypt.hash('BvAdmin123', 12);

        await queryInterface.sequelize.query(`
      INSERT INTO users (email, password_hash, role_id, facility_id, is_active)
      VALUES
        ('admin@geobackend.com', '${superAdminPasswordHash}', 1, NULL, true)
      ON CONFLICT (email) DO NOTHING;
    `);

        for (const row of HOSPITAL_ADMIN_ROWS) {
            await queryInterface.sequelize.query(`
        INSERT INTO users (email, password_hash, role_id, facility_id, is_active)
        VALUES (
          '${row.email}',
          '${hospitalAdminPasswordHash}',
          2,
          (
            SELECT id FROM medical_facility
            WHERE type = 'hospital'
            ORDER BY id ASC
            LIMIT 1 OFFSET ${Number(row.hospitalOffset)}
          ),
          true
        )
        ON CONFLICT (email) DO NOTHING;
      `);
        }
    },

    async down(queryInterface) {
        const emails = [
            'admin@geobackend.com',
            ...HOSPITAL_ADMIN_ROWS.map((r) => r.email),
            'hospital.admin@geobackend.com',
        ];
        const list = emails.map((e) => `'${e.replace(/'/g, "''")}'`).join(', ');
        await queryInterface.sequelize.query(`
      DELETE FROM users
      WHERE email IN (${list});
    `);
    },
};
