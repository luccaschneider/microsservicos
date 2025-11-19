package com.microsservicos.microsservicos.controller;

import com.microsservicos.microsservicos.dto.AuthResponseDTO;
import com.microsservicos.microsservicos.dto.LoginDTO;
import com.microsservicos.microsservicos.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Autenticação", description = "Endpoints de autenticação")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping
    @Operation(summary = "Realizar login", description = "Autentica um usuário e retorna um token JWT")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        AuthResponseDTO response = authService.login(loginDTO);
        return ResponseEntity.ok(response);
    }
}

