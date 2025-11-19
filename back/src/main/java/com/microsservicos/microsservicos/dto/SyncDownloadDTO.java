package com.microsservicos.microsservicos.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SyncDownloadDTO {
    private List<EventoDTO> eventos;
    private List<UsuarioDTO> usuarios;
}

