ALTER TABLE log_acesso 
ADD COLUMN request_body TEXT,
ADD COLUMN response_body TEXT,
ADD COLUMN request_headers TEXT,
ADD COLUMN response_headers TEXT;

