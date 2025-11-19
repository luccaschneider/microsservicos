package com.microsservicos.microsservicos.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InscricaoCreateDTO {
    private UUID usuarioId; // Opcional - se não informado, usa o usuário logado

    @NotNull(message = "ID do evento é obrigatório")
    private UUID eventoId;

    private Boolean offline = false;
}

