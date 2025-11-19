package com.microsservicos.microsservicos.exception;

import com.microsservicos.microsservicos.dto.ErrorDTO;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;

@RestControllerAdvice
@Hidden
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorDTO> handleRuntimeException(RuntimeException ex, WebRequest request) {
        ErrorDTO error = new ErrorDTO();
        error.setMensagem(ex.getMessage());
        error.setErro("RuntimeException");
        error.setTimestamp(LocalDateTime.now());
        error.setPath(request.getDescription(false).replace("uri=", ""));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDTO> handleValidationException(MethodArgumentNotValidException ex, WebRequest request) {
        StringBuilder mensagens = new StringBuilder();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            mensagens.append(error.getField()).append(": ").append(error.getDefaultMessage()).append("; ");
        });

        ErrorDTO error = new ErrorDTO();
        error.setMensagem(mensagens.toString());
        error.setErro("ValidationException");
        error.setTimestamp(LocalDateTime.now());
        error.setPath(request.getDescription(false).replace("uri=", ""));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorDTO> handleConstraintViolationException(ConstraintViolationException ex, WebRequest request) {
        ErrorDTO error = new ErrorDTO();
        error.setMensagem(ex.getMessage());
        error.setErro("ConstraintViolationException");
        error.setTimestamp(LocalDateTime.now());
        error.setPath(request.getDescription(false).replace("uri=", ""));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> handleGenericException(Exception ex, WebRequest request) {
        ErrorDTO error = new ErrorDTO();
        error.setMensagem("Erro interno do servidor");
        error.setErro(ex.getClass().getSimpleName());
        error.setTimestamp(LocalDateTime.now());
        error.setPath(request.getDescription(false).replace("uri=", ""));
        
        // Log do erro completo para debug
        ex.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

