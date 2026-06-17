const express = require('express');
const db = require('../db');
const { getTeamMetrics } = require('../services/azureDevOps');

const router = express.Router();

// In-memory fallback used when DB is not available
const FALLBACK_TEAMS = [
  {
    id: 1,
    name: 'Example Agile Team',
    organization: 'borouge',
    project: 'SampleProject',
    areaPath: "Borouge International\\Team A",
    iterationPath: "Borouge International\\Team A\\Sprint 1",
  },
];

const friendlyDbError = (res, err) => {
  console.error('DB error:', err && err.message ? err.message : err);
  res.status(500).json({ error: 'Database not configured or unavailable. Returning fallback data.' });
};

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, organization, project, area_path AS "areaPath", iteration_path AS "iterationPath" FROM teams ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('DB error:', err && err.message ? err.message : err);
    return res.status(200).json(FALLBACK_TEAMS);
  }
});

router.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    const { iterationPath } = req.query;
    const result = await db.query('SELECT * FROM teams WHERE id = $1', [id]);
    const team = result.rows[0];
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const metrics = await getTeamMetrics({
      organization: team.organization,
      project: team.project,
      areaPath: team.area_path,
      iterationPath: iterationPath || team.iteration_path,
    });

    res.json({ team, metrics });
  } catch (err) {
    // If DB failed, try to return fallback team/dashboard
    console.error('Error fetching dashboard:', err && err.message ? err.message : err);
    // find fallback by id
    const fid = Number(req.params.id);
    const team = FALLBACK_TEAMS.find((t) => t.id === fid) || FALLBACK_TEAMS[0];

    // minimal fallback metrics
    const metrics = {
      itemCount: 0,
      originalEstimate: 0,
      completedWork: 0,
      sprintVelocity: 0,
      averageCompletedHours: 0,
      bugsAndRequirementsCompleted: 0,
      workItems: [],
    };

    res.status(200).json({ team, metrics, message: 'Returned fallback dashboard due to DB/API error.' });
  }
});

module.exports = router;
