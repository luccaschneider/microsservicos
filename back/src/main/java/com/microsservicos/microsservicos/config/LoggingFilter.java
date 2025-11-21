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
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
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

            // Capturar request body
            if (request instanceof ContentCachingRequestWrapper) {
                ContentCachingRequestWrapper wrappedRequest = (ContentCachingRequestWrapper) request;
                byte[] contentAsBytes = wrappedRequest.getContentAsByteArray();
                if (contentAsBytes.length > 0) {
                    String requestBody = new String(contentAsBytes, StandardCharsets.UTF_8);
                    // Limitar tamanho para evitar logs muito grandes (máximo 50KB)
                    if (requestBody.length() > 50000) {
                        requestBody = requestBody.substring(0, 50000) + "... [truncated]";
                    }
                    log.setRequestBody(requestBody);
                }
                
                // Capturar request headers (exceto Authorization por segurança)
                String requestHeaders = getRequestHeaders(wrappedRequest);
                log.setRequestHeaders(requestHeaders);
            }

            // Capturar response body
            if (response instanceof ContentCachingResponseWrapper) {
                ContentCachingResponseWrapper wrappedResponse = (ContentCachingResponseWrapper) response;
                byte[] contentAsBytes = wrappedResponse.getContentAsByteArray();
                if (contentAsBytes.length > 0) {
                    String responseBody = new String(contentAsBytes, StandardCharsets.UTF_8);
                    // Limitar tamanho para evitar logs muito grandes (máximo 50KB)
                    if (responseBody.length() > 50000) {
                        responseBody = responseBody.substring(0, 50000) + "... [truncated]";
                    }
                    log.setResponseBody(responseBody);
                }
                
                // Capturar response headers
                String responseHeaders = getResponseHeaders(wrappedResponse);
                log.setResponseHeaders(responseHeaders);
            }

            // Obter usuário do contexto de segurança
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof UUID) {
                Object principal = authentication.getPrincipal();
                if (principal != null) {
                    UUID userId = (UUID) principal;
                    usuarioRepository.findById(userId).ifPresent(log::setUsuario);
                }
            }

            logAcessoRepository.save(log);
        } catch (Exception e) {
            logger.error("Erro ao registrar log de acesso", e);
        }
    }

    private String getRequestHeaders(HttpServletRequest request) {
        StringBuilder headers = new StringBuilder();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            // Não incluir Authorization completo por segurança, apenas indicar se existe
            if ("Authorization".equalsIgnoreCase(headerName)) {
                String authHeader = request.getHeader(headerName);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    headers.append(headerName).append(": Bearer [REDACTED]");
                } else {
                    headers.append(headerName).append(": [REDACTED]");
                }
            } else {
                headers.append(headerName).append(": ").append(request.getHeader(headerName));
            }
            if (headerNames.hasMoreElements()) {
                headers.append("\n");
            }
        }
        return headers.toString();
    }

    private String getResponseHeaders(HttpServletResponse response) {
        StringBuilder headers = new StringBuilder();
        java.util.Collection<String> headerNames = response.getHeaderNames();
        int index = 0;
        for (String headerName : headerNames) {
            headers.append(headerName).append(": ").append(response.getHeader(headerName));
            if (index < headerNames.size() - 1) {
                headers.append("\n");
            }
            index++;
        }
        return headers.toString();
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

