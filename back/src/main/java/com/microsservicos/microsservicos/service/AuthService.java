package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.config.JwtTokenProvider;
import com.microsservicos.microsservicos.dto.AuthResponseDTO;
import com.microsservicos.microsservicos.dto.LoginDTO;
import com.microsservicos.microsservicos.dto.UsuarioDTO;
import com.microsservicos.microsservicos.entity.Usuario;
import com.microsservicos.microsservicos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    public AuthResponseDTO login(LoginDTO loginDTO) {
        Usuario usuario = usuarioRepository.findByEmail(loginDTO.getEmail())
                .orElseThrow(() -> new RuntimeException("Email ou senha inválidos"));

        if (!passwordEncoder.matches(loginDTO.getSenha(), usuario.getSenha())) {
            throw new RuntimeException("Email ou senha inválidos");
        }

        String token = tokenProvider.generateToken(usuario.getId(), usuario.getEmail(), usuario.getNome());

        UsuarioDTO usuarioDTO = new UsuarioDTO();
        usuarioDTO.setId(usuario.getId());
        usuarioDTO.setNome(usuario.getNome());
        usuarioDTO.setEmail(usuario.getEmail());
        usuarioDTO.setCpf(usuario.getCpf());
        usuarioDTO.setTelefone(usuario.getTelefone());
        usuarioDTO.setDadosCompletos(usuario.getDadosCompletos());
        usuarioDTO.setCriadoOffline(usuario.getCriadoOffline());
        usuarioDTO.setSincronizado(usuario.getSincronizado());
        usuarioDTO.setDataCriacao(usuario.getDataCriacao());
        usuarioDTO.setDataAtualizacao(usuario.getDataAtualizacao());

        AuthResponseDTO response = new AuthResponseDTO();
        response.setToken(token);
        response.setUsuario(usuarioDTO);
        response.setExpiresIn(jwtExpiration);

        return response;
    }

    public UUID getUserIdFromToken(String token) {
        return tokenProvider.getUserIdFromToken(token);
    }
}

