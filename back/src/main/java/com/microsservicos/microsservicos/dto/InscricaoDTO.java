package com.microsservicos.microsservicos.dto;

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
public class InscricaoDTO {
    private UUID id;
    private UUID usuarioId;
    private String usuarioNome;
    private String usuarioEmail;
    private UUID eventoId;
    private String eventoNome;
    private LocalDateTime dataInscricao;
    private Boolean cancelada;
    private LocalDateTime dataCancelamento;
    private Boolean criadaOffline;
    private Boolean sincronizado;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataAtualizacao;
}

