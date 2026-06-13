const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/postgres'
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/now', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
