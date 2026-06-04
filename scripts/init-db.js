require('dotenv').config();

const { Client } = require('pg');
const { spawn } = require('child_process');

const DATABASE_URL = process.env.DATABASE_URL;
const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment.');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPostgres() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
      await client.connect();
      await client.query('SELECT 1;');
      await client.end();
      console.log('Postgres is ready.');
      return;
    } catch (error) {
      await client.end().catch(() => {});
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      console.log(`Waiting for Postgres (${attempt}/${MAX_RETRIES})...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

async function main() {
  await waitForPostgres();
  await runCommand('npx', ['sequelize-cli', 'db:migrate']);
  await runCommand('npx', ['sequelize-cli', 'db:seed:all']);
  console.log('Database migration and seeding completed.');
}

main().catch((error) => {
  console.error('Failed to initialize database:', error.message);
  process.exit(1);
});
