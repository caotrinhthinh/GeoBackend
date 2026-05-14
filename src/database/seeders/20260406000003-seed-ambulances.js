'use strict';

/**
 * Xe cứu thương gắn bệnh viện (dev seed). Biển số unique toàn hệ thống.
 * Chạy sau seed medical_facility (20260406000001).
 *
 * @type {import('sequelize-cli').Migration}
 */
const PLATES_BY_HOSPITAL_OFFSET = [
  { offset: 0, plates: ['59H-CR-01', '59H-CR-02', '59H-CR-03'] },
  { offset: 1, plates: ['59H-115-A1', '59H-115-A2'] },
  { offset: 2, plates: ['59H-YD-01', '59H-YD-02'] },
];

module.exports = {
  async up(queryInterface) {
    for (const group of PLATES_BY_HOSPITAL_OFFSET) {
      for (const plate of group.plates) {
        const safePlate = plate.replace(/'/g, "''");
        await queryInterface.sequelize.query(`
          INSERT INTO ambulance (plate_number, facility_id, status, current_location)
          SELECT '${safePlate}', id, 'available', location_geom
          FROM medical_facility
          WHERE type = 'hospital'
          ORDER BY id ASC
          LIMIT 1 OFFSET ${Number(group.offset)}
          ON CONFLICT (plate_number) DO NOTHING;
        `);
      }
    }
  },

  async down(queryInterface) {
    const plates = PLATES_BY_HOSPITAL_OFFSET.flatMap((g) => g.plates);
    const list = plates.map((p) => `'${p.replace(/'/g, "''")}'`).join(', ');
    await queryInterface.sequelize.query(`
      DELETE FROM ambulance WHERE plate_number IN (${list});
    `);
  },
};
