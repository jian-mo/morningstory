-- Initialize PostgreSQL for Morning Story
-- This script runs only when the database is first created

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create additional schemas if needed (optional)
-- CREATE SCHEMA IF NOT EXISTS analytics;

-- Set timezone
SET timezone = 'UTC';

-- Performance tuning for development
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 100;

-- Create a read-only user for analytics (optional)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'morning_story_readonly') THEN
        CREATE ROLE morning_story_readonly WITH LOGIN PASSWORD 'readonly_password';
        GRANT CONNECT ON DATABASE morning_story_dev TO morning_story_readonly;
        GRANT USAGE ON SCHEMA public TO morning_story_readonly;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO morning_story_readonly;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO morning_story_readonly;
    END IF;
END
$$;