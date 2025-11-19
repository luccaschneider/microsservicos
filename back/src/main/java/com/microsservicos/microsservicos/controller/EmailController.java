package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.EmailDTO;
import com.microsservicos.microsservicos.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/emails")
@Tag(name = "E-mails", description = "Endpoints de envio de e-mails")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping
    @Operation(summary = "Enviar e-mail", description = "Envia um e-mail manualmente")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<Void> enviarEmail(@Valid @RequestBody EmailDTO emailDTO) {
        emailService.enviarEmail(emailDTO);
        return ResponseEntity.ok().build();
    }
}

