CREATE TABLE log_acesso (
    id UUID PRIMARY KEY,
    endpoint VARCHAR(500) NOT NULL,
    metodo VARCHAR(10) NOT NULL,
    usuario_id UUID,
    timestamp TIMESTAMP NOT NULL,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    status_code INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_log_acesso_usuario ON log_acesso(usuario_id);
CREATE INDEX idx_log_acesso_endpoint ON log_acesso(endpoint);
CREATE INDEX idx_log_acesso_timestamp ON log_acesso(timestamp);

