package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.dto.UsuarioCreateDTO;
import com.microsservicos.microsservicos.dto.UsuarioDTO;
import com.microsservicos.microsservicos.dto.UsuarioUpdateDTO;
import com.microsservicos.microsservicos.entity.Usuario;
import com.microsservicos.microsservicos.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public UsuarioDTO criarUsuario(UsuarioCreateDTO dto, boolean offline) {
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        usuario.setTelefone(dto.getTelefone());
        usuario.setDadosCompletos(false);
        usuario.setCriadoOffline(offline);
        usuario.setSincronizado(!offline);

        usuario = usuarioRepository.save(usuario);
        return toDTO(usuario);
    }

    @Transactional
    public UsuarioDTO completarDados(UUID id, UsuarioUpdateDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (dto.getNome() != null) {
            usuario.setNome(dto.getNome());
        }
        if (dto.getCpf() != null) {
            if (usuarioRepository.existsByCpf(dto.getCpf()) && !dto.getCpf().equals(usuario.getCpf())) {
                throw new RuntimeException("CPF já cadastrado");
            }
            usuario.setCpf(dto.getCpf());
        }
        if (dto.getTelefone() != null) {
            usuario.setTelefone(dto.getTelefone());
        }

        usuario.setDadosCompletos(true);
        usuario = usuarioRepository.save(usuario);
        return toDTO(usuario);
    }

    public UsuarioDTO buscarPorId(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return toDTO(usuario);
    }

    public UsuarioDTO buscarPorEmail(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return toDTO(usuario);
    }

    public List<UsuarioDTO> listarNaoSincronizados() {
        return usuarioRepository.findBySincronizadoFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private UsuarioDTO toDTO(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(usuario.getId());
        dto.setNome(usuario.getNome());
        dto.setEmail(usuario.getEmail());
        dto.setCpf(usuario.getCpf());
        dto.setTelefone(usuario.getTelefone());
        dto.setDadosCompletos(usuario.getDadosCompletos());
        dto.setCriadoOffline(usuario.getCriadoOffline());
        dto.setSincronizado(usuario.getSincronizado());
        dto.setDataCriacao(usuario.getDataCriacao());
        dto.setDataAtualizacao(usuario.getDataAtualizacao());
        return dto;
    }

    public Usuario findEntityById(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}

