CREATE TABLE certificados (
    id UUID PRIMARY KEY,
    inscricao_id UUID NOT NULL UNIQUE,
    codigo_unico VARCHAR(255) NOT NULL UNIQUE,
    data_emissao TIMESTAMP NOT NULL,
    url_validacao VARCHAR(500) NOT NULL,
    template_usado TEXT,
    FOREIGN KEY (inscricao_id) REFERENCES inscricoes(id) ON DELETE CASCADE
);

CREATE INDEX idx_certificados_codigo_unico ON certificados(codigo_unico);
CREATE INDEX idx_certificados_inscricao ON certificados(inscricao_id);

