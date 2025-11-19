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
public class PresencaDTO {
    private UUID id;
    private UUID inscricaoId;
    private UUID usuarioId;
    private String usuarioNome;
    private UUID eventoId;
    private String eventoNome;
    private LocalDateTime dataCheckIn;
    private Boolean criadaOffline;
    private Boolean sincronizado;
    private LocalDateTime dataCriacao;
}

