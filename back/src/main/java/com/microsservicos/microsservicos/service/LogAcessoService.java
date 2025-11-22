package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.dto.LogAcessoDTO;
import com.microsservicos.microsservicos.entity.LogAcesso;
import com.microsservicos.microsservicos.repository.LogAcessoRepository;
import com.microsservicos.microsservicos.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class LogAcessoService {

    @Autowired
    private LogAcessoRepository logAcessoRepository;

    public Page<LogAcessoDTO> listarLogs(Pageable pageable, String endpoint, String metodo,
                                         UUID usuarioId, Integer statusCode,
                                         LocalDateTime dataInicio, LocalDateTime dataFim) {
        Specification<LogAcesso> spec = (root, query, cb) -> cb.conjunction();

        if (endpoint != null && !endpoint.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("endpoint")), "%" + endpoint.toLowerCase() + "%"));
        }

        if (metodo != null && !metodo.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("metodo"), metodo.toUpperCase()));
        }

        if (usuarioId != null) {
            UUID finalUsuarioId = usuarioId;
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("usuario").get("id"), finalUsuarioId));
        }

        if (statusCode != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("statusCode"), statusCode));
        }

        if (dataInicio != null) {
            spec = spec.and((root, query, cb) -> 
                cb.greaterThanOrEqualTo(root.get("timestamp"), dataInicio));
        }

        if (dataFim != null) {
            spec = spec.and((root, query, cb) -> 
                cb.lessThanOrEqualTo(root.get("timestamp"), dataFim));
        }

        // Garantir ordenação por timestamp decrescente (mais recentes primeiro)
        Pageable sortedPageable = org.springframework.data.domain.PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp")
        );
        return logAcessoRepository.findAll(spec, sortedPageable).map(this::toDTO);
    }

    public LogAcessoDTO buscarLog(UUID id) {
        LogAcesso log = logAcessoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log não encontrado"));
        return toDTO(log);
    }

    public Page<LogAcessoDTO> listarLogsDoUsuario(Pageable pageable) {
        UUID usuarioId = SecurityUtil.getCurrentUserId();
        // Garantir ordenação por timestamp decrescente (mais recentes primeiro)
        Pageable sortedPageable = org.springframework.data.domain.PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "timestamp")
        );
        return logAcessoRepository.findByUsuarioIdOrderByTimestampDesc(usuarioId, sortedPageable).map(this::toDTO);
    }

    private LogAcessoDTO toDTO(LogAcesso log) {
        LogAcessoDTO dto = new LogAcessoDTO();
        dto.setId(log.getId());
        dto.setEndpoint(log.getEndpoint());
        dto.setMetodo(log.getMetodo());
        dto.setTimestamp(log.getTimestamp());
        dto.setIp(log.getIp());
        dto.setUserAgent(log.getUserAgent());
        dto.setStatusCode(log.getStatusCode());
        dto.setRequestBody(log.getRequestBody());
        dto.setResponseBody(log.getResponseBody());
        dto.setRequestHeaders(log.getRequestHeaders());
        dto.setResponseHeaders(log.getResponseHeaders());

        if (log.getUsuario() != null) {
            dto.setUsuarioId(log.getUsuario().getId());
            dto.setUsuarioNome(log.getUsuario().getNome());
            dto.setUsuarioEmail(log.getUsuario().getEmail());
        }

        return dto;
    }
}

