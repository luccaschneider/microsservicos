package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.PresencaCreateDTO;
import com.microsservicos.microsservicos.dto.PresencaDTO;
import com.microsservicos.microsservicos.service.InscricaoService;
import com.microsservicos.microsservicos.service.PresencaService;
import com.microsservicos.microsservicos.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/presencas")
@Tag(name = "Presenças", description = "Endpoints de gerenciamento de presenças (check-in)")
public class PresencaController {

    @Autowired
    private PresencaService presencaService;

    @Autowired
    private InscricaoService inscricaoService;

    @PostMapping
    @Operation(summary = "Registrar minha presença", description = "Registra o check-in do usuário logado")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<PresencaDTO> registrarMinhaPresenca(@Valid @RequestBody PresencaCreateDTO dto) {
        UUID usuarioId = SecurityUtil.getCurrentUserId();
        PresencaDTO presenca;
        boolean offline = dto.getOffline() != null && dto.getOffline();

        if (dto.getInscricaoId() != null) {
            // Verificar se a inscrição pertence ao usuário logado
            var inscricao = inscricaoService.findEntityById(dto.getInscricaoId());
            if (!inscricao.getUsuario().getId().equals(usuarioId)) {
                throw new RuntimeException("Inscrição não pertence ao usuário logado");
            }
            presenca = presencaService.registrarPresenca(dto.getInscricaoId(), offline);
        } else if (dto.getEventoId() != null) {
            presenca = presencaService.registrarPresencaPorUsuarioEEvento(usuarioId, dto.getEventoId(), offline);
        } else {
            throw new RuntimeException("É necessário informar inscricaoId ou eventoId");
        }

        return ResponseEntity.ok(presenca);
    }

    @PostMapping("/terceiro")
    @Operation(summary = "Registrar presença de terceiro", description = "Registra o check-in de outro participante (para atendentes)")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<PresencaDTO> registrarPresencaTerceiro(@Valid @RequestBody PresencaCreateDTO dto) {
        PresencaDTO presenca;
        boolean offline = dto.getOffline() != null && dto.getOffline();

        if (dto.getInscricaoId() != null) {
            presenca = presencaService.registrarPresenca(dto.getInscricaoId(), offline);
        } else if (dto.getUsuarioId() != null && dto.getEventoId() != null) {
            presenca = presencaService.registrarPresencaPorUsuarioEEvento(
                    dto.getUsuarioId(), dto.getEventoId(), offline);
        } else {
            throw new RuntimeException("É necessário informar inscricaoId ou (usuarioId e eventoId)");
        }

        return ResponseEntity.ok(presenca);
    }

    @GetMapping("/inscricao/{inscricaoId}")
    @Operation(summary = "Buscar presença por inscrição", description = "Retorna a presença registrada para uma inscrição")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<PresencaDTO> buscarPorInscricao(@PathVariable UUID inscricaoId) {
        PresencaDTO presenca = presencaService.buscarPorInscricao(inscricaoId);
        return ResponseEntity.ok(presenca);
    }
}

