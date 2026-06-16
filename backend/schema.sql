CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  project TEXT NOT NULL,
  area_path TEXT NOT NULL,
  iteration_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example team configuration:
INSERT INTO teams (name, organization, project, area_path, iteration_path)
VALUES
  ('Example Agile Team', 'borouge', 'SampleProject', 'Borouge International\\Team A', 'Borouge International\\Team A\\Sprint 1')
ON CONFLICT DO NOTHING;
