package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.UsuarioCreateDTO;
import com.microsservicos.microsservicos.dto.UsuarioDTO;
import com.microsservicos.microsservicos.dto.UsuarioUpdateDTO;
import com.microsservicos.microsservicos.service.UsuarioService;
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
@RequestMapping("/usuarios")
@Tag(name = "Usuários", description = "Endpoints de gerenciamento de usuários")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping
    @Operation(summary = "Criar usuário", description = "Cria um novo usuário (cadastro simplificado)")
    public ResponseEntity<UsuarioDTO> criarUsuario(@Valid @RequestBody UsuarioCreateDTO dto,
                                                    @RequestParam(required = false, defaultValue = "false") boolean offline) {
        UsuarioDTO usuario = usuarioService.criarUsuario(dto, offline);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/me")
    @Operation(summary = "Completar meus dados", description = "Complementa os dados do usuário logado")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<UsuarioDTO> completarMeusDados(@Valid @RequestBody UsuarioUpdateDTO dto) {
        UUID usuarioId = SecurityUtil.getCurrentUserId();
        UsuarioDTO usuario = usuarioService.completarDados(usuarioId, dto);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Completar dados de outro usuário", description = "Complementa os dados de um usuário específico (para terceiros)")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<UsuarioDTO> completarDados(@PathVariable UUID id,
                                                      @Valid @RequestBody UsuarioUpdateDTO dto) {
        UsuarioDTO usuario = usuarioService.completarDados(id, dto);
        return ResponseEntity.ok(usuario);
    }

    @GetMapping("/me")
    @Operation(summary = "Buscar meus dados", description = "Retorna os dados do usuário logado")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<UsuarioDTO> buscarMeusDados() {
        UUID usuarioId = SecurityUtil.getCurrentUserId();
        UsuarioDTO usuario = usuarioService.buscarPorId(usuarioId);
        return ResponseEntity.ok(usuario);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuário por ID", description = "Retorna os dados de um usuário específico")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<UsuarioDTO> buscarPorId(@PathVariable UUID id) {
        UsuarioDTO usuario = usuarioService.buscarPorId(id);
        return ResponseEntity.ok(usuario);
    }
}

