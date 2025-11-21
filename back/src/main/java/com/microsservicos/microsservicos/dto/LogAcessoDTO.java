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
public class LogAcessoDTO {
    private UUID id;
    private String endpoint;
    private String metodo;
    private UUID usuarioId;
    private String usuarioNome;
    private String usuarioEmail;
    private LocalDateTime timestamp;
    private String ip;
    private String userAgent;
    private Integer statusCode;
    private String requestBody;
    private String responseBody;
    private String requestHeaders;
    private String responseHeaders;
}

