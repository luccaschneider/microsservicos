package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.InscricaoCreateDTO;
import com.microsservicos.microsservicos.dto.InscricaoDTO;
import com.microsservicos.microsservicos.service.InscricaoService;
import com.microsservicos.microsservicos.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/inscricoes")
@Tag(name = "Inscrições", description = "Endpoints de gerenciamento de inscrições")
public class InscricaoController {

    @Autowired
    private InscricaoService inscricaoService;

    @GetMapping("/{id}")
    @Operation(summary = "Consultar inscrição", description = "Retorna os dados de uma inscrição")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<InscricaoDTO> buscarPorId(@PathVariable UUID id) {
        InscricaoDTO inscricao = inscricaoService.buscarPorId(id);
        return ResponseEntity.ok(inscricao);
    }

    @PostMapping
    @Operation(summary = "Criar minha inscrição", description = "Registra uma nova inscrição do usuário logado em um evento")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<InscricaoDTO> criarMinhaInscricao(@Valid @RequestBody InscricaoCreateDTO dto) {
        UUID usuarioId = SecurityUtil.getCurrentUserId();
        InscricaoDTO inscricao = inscricaoService.criarInscricao(
                usuarioId,
                dto.getEventoId(),
                dto.getOffline() != null && dto.getOffline(),
                dto.getSenhaTemporaria()
        );
        return ResponseEntity.ok(inscricao);
    }

    @PostMapping("/terceiro")
    @Operation(summary = "Criar inscrição para terceiro", description = "Registra uma nova inscrição para outro usuário (para atendentes)")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<InscricaoDTO> criarInscricaoTerceiro(@Valid @RequestBody InscricaoCreateDTO dto) {
        if (dto.getUsuarioId() == null) {
            throw new RuntimeException("É necessário informar o usuarioId para criar inscrição de terceiro");
        }
        InscricaoDTO inscricao = inscricaoService.criarInscricao(
                dto.getUsuarioId(),
                dto.getEventoId(),
                dto.getOffline() != null && dto.getOffline(),
                dto.getSenhaTemporaria()
        );
        return ResponseEntity.ok(inscricao);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar inscrição", description = "Cancela uma inscrição")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<Void> cancelarInscricao(@PathVariable UUID id) {
        inscricaoService.cancelarInscricao(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Listar minhas inscrições", description = "Retorna todas as inscrições do usuário logado")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<List<InscricaoDTO>> buscarMinhasInscricoes() {
        UUID usuarioId = SecurityUtil.getCurrentUserId();
        List<InscricaoDTO> inscricoes = inscricaoService.buscarPorUsuario(usuarioId);
        return ResponseEntity.ok(inscricoes);
    }

    @GetMapping("/usuario/{usuarioId}")
    @Operation(summary = "Listar inscrições de outro usuário", description = "Retorna todas as inscrições de um usuário específico")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<List<InscricaoDTO>> buscarPorUsuario(@PathVariable UUID usuarioId) {
        List<InscricaoDTO> inscricoes = inscricaoService.buscarPorUsuario(usuarioId);
        return ResponseEntity.ok(inscricoes);
    }
}

