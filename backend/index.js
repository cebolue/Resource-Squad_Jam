const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const teamRoutes = require('./routes/teams');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/teams', teamRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
