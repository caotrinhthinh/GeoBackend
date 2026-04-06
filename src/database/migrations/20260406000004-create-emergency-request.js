'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TYPE emergency_status_enum AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

      CREATE TABLE IF NOT EXISTS emergency_request (
        id                    SERIAL PRIMARY KEY,
        requester_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        patient_location      GEOGRAPHY(POINT, 4326) NOT NULL,
        assigned_facility_id  INTEGER REFERENCES medical_facility(id) ON DELETE SET NULL,
        assigned_ambulance_id INTEGER REFERENCES ambulance(id) ON DELETE SET NULL,
        status                emergency_status_enum NOT NULL DEFAULT 'pending',
        distance_meters       FLOAT,
        notes                 TEXT,
        created_at            TIMESTAMP DEFAULT NOW(),
        updated_at            TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_emergency_status 
        ON emergency_request(status);
        
      CREATE INDEX IF NOT EXISTS idx_emergency_location 
        ON emergency_request USING GIST(patient_location);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS emergency_request CASCADE;
      DROP TYPE IF EXISTS emergency_status_enum CASCADE;
    `);
  }
};
