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
public class PresencaSyncDTO {
    @JsonDeserialize(using = UUIDDeserializer.class)
    private UUID id;
    @JsonDeserialize(using = UUIDDeserializer.class)
    private UUID inscricaoId;
    private LocalDateTime dataCheckIn;
    private Boolean criadaOffline;
    private LocalDateTime dataCriacao;
}

