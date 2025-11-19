package com.microsservicos.microsservicos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PresencaCreateDTO {
    private UUID inscricaoId;
    private UUID usuarioId;
    private UUID eventoId;
    private Boolean offline = false;
}

