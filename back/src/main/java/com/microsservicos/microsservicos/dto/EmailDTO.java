package com.microsservicos.microsservicos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailDTO {
    @NotBlank(message = "Destinatário é obrigatório")
    @Email(message = "Email deve ser válido")
    private String destinatario;

    @NotBlank(message = "Assunto é obrigatório")
    private String assunto;

    @NotBlank(message = "Corpo é obrigatório")
    private String corpo;
}

