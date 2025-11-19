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
public class UsuarioSyncDTO {
    @JsonDeserialize(using = UUIDDeserializer.class)
    private UUID id;
    private String nome;
    private String email;
    private String senha;
    private String cpf;
    private String telefone;
    private Boolean dadosCompletos;
    private Boolean criadoOffline;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataAtualizacao;
}

