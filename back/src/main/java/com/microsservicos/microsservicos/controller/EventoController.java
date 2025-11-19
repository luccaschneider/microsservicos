package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.EventoDTO;
import com.microsservicos.microsservicos.service.EventoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/eventos")
@Tag(name = "Eventos", description = "Endpoints de gerenciamento de eventos")
public class EventoController {

    @Autowired
    private EventoService eventoService;

    @GetMapping
    @Operation(summary = "Listar eventos vigentes", description = "Retorna todos os eventos ativos e vigentes (público)")
    public ResponseEntity<List<EventoDTO>> listarEventos() {
        List<EventoDTO> eventos = eventoService.listarEventos();
        return ResponseEntity.ok(eventos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar evento por ID", description = "Retorna os dados de um evento específico (público)")
    public ResponseEntity<EventoDTO> buscarPorId(@PathVariable UUID id) {
        EventoDTO evento = eventoService.buscarPorId(id);
        return ResponseEntity.ok(evento);
    }
}

