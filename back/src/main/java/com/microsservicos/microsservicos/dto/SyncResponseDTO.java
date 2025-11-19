package com.microsservicos.microsservicos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SyncResponseDTO {
    private Integer usuariosProcessados;
    private Integer inscricoesProcessadas;
    private Integer presencasProcessadas;
    private Integer erros;
    private String mensagem;
}

