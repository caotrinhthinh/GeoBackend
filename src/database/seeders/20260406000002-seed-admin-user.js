'use strict';
const bcrypt = require('bcryptjs');

/**
 * Dev seed accounts (không dùng production).
 *
 * Quy ước admin trực ban (role_id = 2):
 *   Email:    admin.{slug}@geobackend.com   (slug ASCII, gắn offset BV trong seed)
 *   Mật khẩu: BvAdmin123                    (chung cho mọi tài khoản BV seed)
 *
 * hospitalOffset = thứ tự `rawHospitals` (ORDER BY id ASC, LIMIT 1 OFFSET n).
 * SuperAdmin giữ: admin@geobackend.com / admin123
 */
const HOSPITAL_ADMIN_ROWS = [
    { email: 'admin.cho-ray@geobackend.com', hospitalOffset: 0 },
    { email: 'admin.nhan-dan-115@geobackend.com', hospitalOffset: 1 },
    { email: 'admin.dh-y-duoc@geobackend.com', hospitalOffset: 2 },
    { email: 'admin.tu-du@geobackend.com', hospitalOffset: 3 },
    { email: 'admin.hung-vuong@geobackend.com', hospitalOffset: 4 },
    { email: 'admin.nhi-dong-1@geobackend.com', hospitalOffset: 5 },
    { email: 'admin.nhi-dong-2@geobackend.com', hospitalOffset: 6 },
    { email: 'admin.gia-dinh@geobackend.com', hospitalOffset: 7 },
    { email: 'admin.ung-buou@geobackend.com', hospitalOffset: 8 },
    { email: 'admin.benh-nhiet-doi@geobackend.com', hospitalOffset: 9 },
    { email: 'admin.binh-dan@geobackend.com', hospitalOffset: 10 },
    { email: 'admin.nguyen-tri-phuong@geobackend.com', hospitalOffset: 11 },
    { email: 'admin.trung-vuong@geobackend.com', hospitalOffset: 12 },
    { email: 'admin.thong-nhat@geobackend.com', hospitalOffset: 13 },
    { email: 'admin.pham-ngoc-thach@geobackend.com', hospitalOffset: 14 },
    { email: 'admin.da-lieu@geobackend.com', hospitalOffset: 15 },
    { email: 'admin.mat@geobackend.com', hospitalOffset: 16 },
    { email: 'admin.tai-mui-hong@geobackend.com', hospitalOffset: 17 },
    { email: 'admin.rang-ham-mat@geobackend.com', hospitalOffset: 18 },
    { email: 'admin.chan-thuong-chinh-hinh@geobackend.com', hospitalOffset: 19 },
    { email: 'admin.y-hoc-co-truyen@geobackend.com', hospitalOffset: 20 },
    { email: 'admin.truyen-mau@geobackend.com', hospitalOffset: 21 },
    { email: 'admin.tam-than@geobackend.com', hospitalOffset: 22 },
    { email: 'admin.tan-dinh@geobackend.com', hospitalOffset: 23 },
    { email: 'admin.le-van-thinh@geobackend.com', hospitalOffset: 24 },
    { email: 'admin.quan-3@geobackend.com', hospitalOffset: 25 },
    { email: 'admin.quan-4@geobackend.com', hospitalOffset: 26 },
    { email: 'admin.quan-5@geobackend.com', hospitalOffset: 27 },
    { email: 'admin.quan-6@geobackend.com', hospitalOffset: 28 },
    { email: 'admin.nguyen-thi-thap@geobackend.com', hospitalOffset: 29 },
    { email: 'admin.quan-8@geobackend.com', hospitalOffset: 30 },
    { email: 'admin.quan-10@geobackend.com', hospitalOffset: 31 },
    { email: 'admin.lanh-binh-thang@geobackend.com', hospitalOffset: 32 },
    { email: 'admin.trung-my-tay@geobackend.com', hospitalOffset: 33 },
    { email: 'admin.tan-binh@geobackend.com', hospitalOffset: 34 },
    { email: 'admin.phu-nhuan@geobackend.com', hospitalOffset: 35 },
    { email: 'admin.go-vap@geobackend.com', hospitalOffset: 36 },
    { email: 'admin.binh-thanh@geobackend.com', hospitalOffset: 37 },
    { email: 'admin.tan-phu@geobackend.com', hospitalOffset: 38 },
    { email: 'admin.thu-duc@geobackend.com', hospitalOffset: 39 },
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
