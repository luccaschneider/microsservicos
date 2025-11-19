CREATE TABLE eventos (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    template_certificado TEXT,
    data_criacao TIMESTAMP NOT NULL,
    data_atualizacao TIMESTAMP
);

CREATE INDEX idx_eventos_ativo ON eventos(ativo);
CREATE INDEX idx_eventos_data_inicio ON eventos(data_inicio);
CREATE INDEX idx_eventos_data_fim ON eventos(data_fim);

