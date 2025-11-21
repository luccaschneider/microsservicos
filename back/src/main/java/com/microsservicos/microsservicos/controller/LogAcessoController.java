package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.LogAcessoDTO;
import com.microsservicos.microsservicos.service.LogAcessoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/logs")
@Tag(name = "Logs de Acesso", description = "Endpoints para visualizar logs de acesso às APIs")
public class LogAcessoController {

    @Autowired
    private LogAcessoService logAcessoService;

    @GetMapping
    @Operation(summary = "Listar logs", description = "Lista todos os logs de acesso com paginação e filtros opcionais")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<Page<LogAcessoDTO>> listarLogs(
            @PageableDefault(size = 50) Pageable pageable,
            @RequestParam(required = false) String endpoint,
            @RequestParam(required = false) String metodo,
            @RequestParam(required = false) UUID usuarioId,
            @RequestParam(required = false) Integer statusCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dataFim) {
        Page<LogAcessoDTO> logs = logAcessoService.listarLogs(
                pageable, endpoint, metodo, usuarioId, statusCode, dataInicio, dataFim);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar log por ID", description = "Busca um log específico por ID")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<LogAcessoDTO> buscarLog(@PathVariable UUID id) {
        LogAcessoDTO log = logAcessoService.buscarLog(id);
        return ResponseEntity.ok(log);
    }

    @GetMapping("/meus-logs")
    @Operation(summary = "Meus logs", description = "Lista os logs de acesso do usuário logado")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<Page<LogAcessoDTO>> meusLogs(
            @PageableDefault(size = 50) Pageable pageable) {
        Page<LogAcessoDTO> logs = logAcessoService.listarLogsDoUsuario(pageable);
        return ResponseEntity.ok(logs);
    }
}

