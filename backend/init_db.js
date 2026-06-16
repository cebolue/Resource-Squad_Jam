const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Set it in the environment or in a .env file.');
  process.exit(1);
}

const sqlPath = path.join(__dirname, 'schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new Client({ connectionString: DATABASE_URL });

async function run() {
  try {
    await client.connect();
    console.log('Connected to database. Running schema...');
    await client.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
