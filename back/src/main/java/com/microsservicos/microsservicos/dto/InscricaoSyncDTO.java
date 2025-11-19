package com.microsservicos.microsservicos.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.microsservicos.microsservicos.util.UUIDDeserializer;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InscricaoSyncDTO {
    @JsonDeserialize(using = UUIDDeserializer.class)
    private UUID id;
    @JsonDeserialize(using = UUIDDeserializer.class)
    private UUID usuarioId; // Pode ser null, será preenchido pelo backend
    @JsonDeserialize(using = UUIDDeserializer.class)
    private UUID eventoId;
    private LocalDateTime dataInscricao;
    private Boolean cancelada;
    private LocalDateTime dataCancelamento;
    private Boolean criadaOffline;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataAtualizacao;
}

