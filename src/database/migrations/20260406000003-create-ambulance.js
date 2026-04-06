'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TYPE ambulance_status_enum AS ENUM ('available', 'dispatched', 'maintenance');

      CREATE TABLE IF NOT EXISTS ambulance (
        id               SERIAL PRIMARY KEY,
        plate_number     VARCHAR(20) UNIQUE NOT NULL,
        facility_id      INTEGER NOT NULL REFERENCES medical_facility(id) ON DELETE CASCADE,
        status           ambulance_status_enum NOT NULL DEFAULT 'available',
        current_location GEOGRAPHY(POINT, 4326),
        created_at       TIMESTAMP DEFAULT NOW(),
        updated_at       TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_ambulance_location 
        ON ambulance USING GIST(current_location);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ambulance CASCADE;
      DROP TYPE IF EXISTS ambulance_status_enum CASCADE;
    `);
  }
};
