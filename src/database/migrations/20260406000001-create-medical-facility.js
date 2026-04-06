'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TYPE facility_type_enum AS ENUM ('hospital', 'pharmacy');

      CREATE TABLE IF NOT EXISTS medical_facility (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        type          facility_type_enum NOT NULL,
        address       VARCHAR(500),
        phone         VARCHAR(20),
        location_geom GEOGRAPHY(POINT, 4326) NOT NULL,
        is_active     BOOLEAN DEFAULT true,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_facility_location 
        ON medical_facility USING GIST(location_geom);
        
      CREATE INDEX IF NOT EXISTS idx_facility_type 
        ON medical_facility(type);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS medical_facility CASCADE;
      DROP TYPE IF EXISTS facility_type_enum CASCADE;
    `);
  }
};
