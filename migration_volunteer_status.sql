-- Migration to add volunteer status management columns
-- Run this SQL script to add the new columns for volunteer status management

-- Add volunteer_status column
ALTER TABLE users ADD COLUMN IF NOT EXISTS volunteer_status VARCHAR(20) DEFAULT 'pending';

-- Add volunteer_held_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS volunteer_held_at TIMESTAMP;

-- Create index for volunteer_status for better query performance
CREATE INDEX IF NOT EXISTS idx_users_volunteer_status ON users(volunteer_status);

-- Update existing records to have proper status
UPDATE users 
SET volunteer_status = CASE 
    WHEN is_volunteer_verified = true THEN 'approved'
    WHEN volunteer_rejected_at IS NOT NULL THEN 'rejected'
    WHEN is_volunteer = true THEN 'pending'
    ELSE 'pending'
END
WHERE volunteer_status IS NULL OR volunteer_status = 'pending';

-- Add check constraint to ensure valid volunteer status values
ALTER TABLE users ADD CONSTRAINT chk_volunteer_status 
CHECK (volunteer_status IN ('pending', 'approved', 'rejected', 'hold', 'revoked'));

-- Create a partial index for active volunteers
CREATE INDEX IF NOT EXISTS idx_users_active_volunteers 
ON users(volunteer_status, volunteer_verified_at DESC) 
WHERE is_volunteer = true;

-- Create a partial index for volunteer requests
CREATE INDEX IF NOT EXISTS idx_users_volunteer_requests 
ON users(volunteer_requested_at DESC) 
WHERE volunteer_status IN ('pending', 'hold');

COMMENT ON COLUMN users.volunteer_status IS 'Status of volunteer application: pending, approved, rejected, hold, revoked';
COMMENT ON COLUMN users.volunteer_held_at IS 'Timestamp when volunteer status was set to hold';
