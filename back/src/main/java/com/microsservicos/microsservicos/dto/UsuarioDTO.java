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
public class UsuarioDTO {
    private UUID id;
    private String nome;
    private String email;
    private String cpf;
    private String telefone;
    private Boolean dadosCompletos;
    private Boolean criadoOffline;
    private Boolean sincronizado;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataAtualizacao;
}

