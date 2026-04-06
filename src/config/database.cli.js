require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {}
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5432/geodb_test',
    dialect: 'postgres',
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
