CREATE TABLE presencas (
    id UUID PRIMARY KEY,
    inscricao_id UUID NOT NULL,
    data_check_in TIMESTAMP NOT NULL,
    criada_offline BOOLEAN NOT NULL DEFAULT FALSE,
    sincronizado BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL,
    FOREIGN KEY (inscricao_id) REFERENCES inscricoes(id) ON DELETE CASCADE,
    UNIQUE(inscricao_id)
);

CREATE INDEX idx_presencas_inscricao ON presencas(inscricao_id);
CREATE INDEX idx_presencas_sincronizado ON presencas(sincronizado);

