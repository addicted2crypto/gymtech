-- Add web3, defi, and custom inquiry types
ALTER TABLE contact_submissions
  DROP CONSTRAINT valid_inquiry_type;

ALTER TABLE contact_submissions
  ADD CONSTRAINT valid_inquiry_type
  CHECK (inquiry_type IN ('general', 'pricing', 'demo', 'support', 'partnership', 'enterprise', 'web3', 'defi', 'custom'));
