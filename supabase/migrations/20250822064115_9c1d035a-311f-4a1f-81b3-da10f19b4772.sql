-- Fix security definer views by dropping them
-- These views are causing security issues and should be handled differently

-- Drop the problematic views
DROP VIEW IF EXISTS error_summary;
DROP VIEW IF EXISTS performance_summary;

-- Create safer materialized views or handle these as queries instead
-- For now, we'll remove them and implement as direct queries in the application