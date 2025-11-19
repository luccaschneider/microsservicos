package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.SyncDownloadDTO;
import com.microsservicos.microsservicos.dto.SyncResponseDTO;
import com.microsservicos.microsservicos.dto.SyncUploadDTO;
import com.microsservicos.microsservicos.service.SincronizacaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sync")
@Tag(name = "Sincronização", description = "Endpoints de sincronização offline")
public class SincronizacaoController {

    @Autowired
    private SincronizacaoService sincronizacaoService;

    @PostMapping("/download")
    @Operation(summary = "Download de dados", description = "Baixa dados do servidor para sincronização offline")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<SyncDownloadDTO> download() {
        SyncDownloadDTO dados = sincronizacaoService.downloadDados();
        return ResponseEntity.ok(dados);
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload de dados", description = "Envia dados criados offline para o servidor. Permite sincronização de usuários sem autenticação, mas requer autenticação para inscrições e presenças.")
    public ResponseEntity<SyncResponseDTO> upload(@Valid @RequestBody SyncUploadDTO uploadDTO) {
        // Se há inscrições ou presenças, requer autenticação
        boolean temInscricoes = uploadDTO.getInscricoes() != null && !uploadDTO.getInscricoes().isEmpty();
        boolean temPresencas = uploadDTO.getPresencas() != null && !uploadDTO.getPresencas().isEmpty();
        
        if (temInscricoes || temPresencas) {
            // Verificar se há autenticação
            try {
                com.microsservicos.microsservicos.util.SecurityUtil.getCurrentUserId();
            } catch (Exception e) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("Autenticação necessária para sincronizar inscrições e presenças"));
            }
        }
        
        SyncResponseDTO response = sincronizacaoService.uploadDados(uploadDTO);
        return ResponseEntity.ok(response);
    }
    
    private SyncResponseDTO createErrorResponse(String mensagem) {
        SyncResponseDTO response = new SyncResponseDTO();
        response.setMensagem(mensagem);
        response.setErros(1);
        return response;
    }
}

