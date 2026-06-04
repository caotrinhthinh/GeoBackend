require('dotenv').config();

function getDialectOptions() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const sslExplicitlyEnabled = process.env.DB_SSL === 'true';
  const isLocalhost = /localhost|127\.0\.0\.1/.test(databaseUrl);

  if (sslExplicitlyEnabled || (!isLocalhost && process.env.NODE_ENV === 'production')) {
    return {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

  return {};
}

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: getDialectOptions()
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5432/geodb_test',
    dialect: 'postgres',
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: getDialectOptions()
  }
};
