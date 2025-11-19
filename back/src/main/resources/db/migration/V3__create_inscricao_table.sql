CREATE TABLE inscricoes (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL,
    evento_id UUID NOT NULL,
    data_inscricao TIMESTAMP NOT NULL,
    cancelada BOOLEAN NOT NULL DEFAULT FALSE,
    data_cancelamento TIMESTAMP,
    criada_offline BOOLEAN NOT NULL DEFAULT FALSE,
    sincronizado BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL,
    data_atualizacao TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, evento_id)
);

CREATE INDEX idx_inscricoes_usuario ON inscricoes(usuario_id);
CREATE INDEX idx_inscricoes_evento ON inscricoes(evento_id);
CREATE INDEX idx_inscricoes_cancelada ON inscricoes(cancelada);
CREATE INDEX idx_inscricoes_sincronizado ON inscricoes(sincronizado);

