'use strict';

/**
 * Xe cứu thương gắn bệnh viện (dev seed). Biển số unique toàn hệ thống.
 * Mỗi offset khớp thứ tự `rawHospitals` trong 20260406000001-seed-medical-facility.js.
 * Mỗi bệnh viện có đúng MIN_AMBULANCES_PER_HOSPITAL xe.
 * Chạy sau seed medical_facility (20260406000001).
 *
 * @type {import('sequelize-cli').Migration}
 */
const MIN_AMBULANCES_PER_HOSPITAL = 5;

/** @type {{ offset: number, code: string, plateStyle?: 'numeric' | 'alpha' }[]} */
const HOSPITAL_AMBULANCE_CODES = [
  { offset: 0, code: 'CR' },
  { offset: 1, code: '115', plateStyle: 'alpha' },
  { offset: 2, code: 'YD' },
  { offset: 3, code: 'TDU' },
  { offset: 4, code: 'HVG' },
  { offset: 5, code: 'ND1' },
  { offset: 6, code: 'ND2' },
  { offset: 7, code: 'GDI' },
  { offset: 8, code: 'UBU' },
  { offset: 9, code: 'BND' },
  { offset: 10, code: 'BDA' },
  { offset: 11, code: 'NTP' },
  { offset: 12, code: 'TVU' },
  { offset: 13, code: 'TNH' },
  { offset: 14, code: 'PNT' },
  { offset: 15, code: 'DLI' },
  { offset: 16, code: 'MAT' },
  { offset: 17, code: 'TMH' },
  { offset: 18, code: 'RHM' },
  { offset: 19, code: 'CTH' },
  { offset: 20, code: 'YCT' },
  { offset: 21, code: 'TMA' },
  { offset: 22, code: 'TTH' },
  { offset: 23, code: 'TDN' },
  { offset: 24, code: 'LVT' },
  { offset: 25, code: 'Q03' },
  { offset: 26, code: 'Q04' },
  { offset: 27, code: 'Q05' },
  { offset: 28, code: 'Q06' },
  { offset: 29, code: 'NTT' },
  { offset: 30, code: 'Q08' },
  { offset: 31, code: 'Q10' },
  { offset: 32, code: 'LBT' },
  { offset: 33, code: 'TMT' },
  { offset: 34, code: 'TBI' },
  { offset: 35, code: 'PNH' },
  { offset: 36, code: 'GVP' },
  { offset: 37, code: 'BTH' },
  { offset: 38, code: 'TPH' },
  { offset: 39, code: 'TDC' },
];

function buildPlatesForHospital(code, count, plateStyle = 'numeric') {
  const plates = [];
  for (let i = 1; i <= count; i += 1) {
    if (plateStyle === 'alpha') {
      plates.push(`59H-${code}-A${i}`);
    } else {
      plates.push(`59H-${code}-${String(i).padStart(2, '0')}`);
    }
  }
  return plates;
}

const PLATES_BY_HOSPITAL_OFFSET = HOSPITAL_AMBULANCE_CODES.map(({ offset, code, plateStyle }) => ({
  offset,
  plates: buildPlatesForHospital(code, MIN_AMBULANCES_PER_HOSPITAL, plateStyle),
}));

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
