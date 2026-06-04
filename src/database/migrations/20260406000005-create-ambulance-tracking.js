'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS ambulance_tracking (
        id                   SERIAL PRIMARY KEY,
        ambulance_id         INTEGER NOT NULL REFERENCES ambulance(id) ON DELETE CASCADE,
        emergency_request_id INTEGER REFERENCES emergency_request(id) ON DELETE SET NULL,
        location             GEOGRAPHY(POINT, 4326) NOT NULL,
        recorded_at          TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tracking_ambulance 
        ON ambulance_tracking(ambulance_id, recorded_at DESC);
        
      CREATE INDEX IF NOT EXISTS idx_tracking_location 
        ON ambulance_tracking USING GIST(location);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ambulance_tracking CASCADE;
    `);
  }
};
