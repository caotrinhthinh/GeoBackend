'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        ALTER TYPE facility_type_enum ADD VALUE 'clinic';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  },

  async down() {
    // PostgreSQL không hỗ trợ gỡ giá trị enum an toàn; giữ nguyên khi rollback.
  },
};
