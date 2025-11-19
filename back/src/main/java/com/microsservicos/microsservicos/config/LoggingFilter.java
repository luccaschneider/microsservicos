package com.microsservicos.microsservicos.config;

import com.microsservicos.microsservicos.entity.LogAcesso;
import com.microsservicos.microsservicos.repository.LogAcessoRepository;
import com.microsservicos.microsservicos.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.UUID;

@Component
public class LoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);

    @Autowired
    private LogAcessoRepository logAcessoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        
        // Pular logging para endpoints do Swagger
        String path = request.getRequestURI();
        if (path != null && (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || 
                path.startsWith("/webjars") || path.startsWith("/swagger-resources"))) {
            filterChain.doFilter(request, response);
            return;
        }
        
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            logRequest(wrappedRequest, wrappedResponse);
            wrappedResponse.copyBodyToResponse();
        }
    }

    private void logRequest(HttpServletRequest request, HttpServletResponse response) {
        try {
            LogAcesso log = new LogAcesso();
            log.setEndpoint(request.getRequestURI());
            log.setMetodo(request.getMethod());
            log.setIp(getClientIpAddress(request));
            log.setUserAgent(request.getHeader("User-Agent"));
            log.setStatusCode(response.getStatus());
            log.setTimestamp(java.time.LocalDateTime.now());

            // Obter usuário do contexto de segurança
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof UUID) {
                UUID userId = (UUID) authentication.getPrincipal();
                usuarioRepository.findById(userId).ifPresent(log::setUsuario);
            }

            logAcessoRepository.save(log);
        } catch (Exception e) {
            logger.error("Erro ao registrar log de acesso", e);
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}

