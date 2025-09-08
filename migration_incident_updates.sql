-- Migration to add incident updates table
-- This allows incident reporters to share updates about their incidents over time

-- Create incident_updates table
CREATE TABLE IF NOT EXISTS incident_updates (
    id BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    status_change TEXT CHECK (status_change IN ('reported', 'investigating', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_reporter_id ON incident_updates(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_created_at ON incident_updates(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE incident_updates IS 'Updates shared by incident reporters about their incidents';
COMMENT ON COLUMN incident_updates.incident_id IS 'Reference to the incident being updated';
COMMENT ON COLUMN incident_updates.reporter_id IS 'User who is providing the update (must be incident reporter)';
COMMENT ON COLUMN incident_updates.update_text IS 'The update content/description';
COMMENT ON COLUMN incident_updates.status_change IS 'Optional status change that comes with this update';
