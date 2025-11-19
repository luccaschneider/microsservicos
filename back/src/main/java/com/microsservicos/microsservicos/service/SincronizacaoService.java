package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.dto.*;
import com.microsservicos.microsservicos.entity.*;
import com.microsservicos.microsservicos.repository.*;
import com.microsservicos.microsservicos.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SincronizacaoService {

    @Autowired
    private EventoService eventoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private InscricaoRepository inscricaoRepository;

    @Autowired
    private PresencaRepository presencaRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public SyncDownloadDTO downloadDados() {
        SyncDownloadDTO dto = new SyncDownloadDTO();
        
        // Buscar eventos ativos e vigentes
        dto.setEventos(eventoService.listarEventos());
        
        // Buscar todos os usuários (para evitar duplicatas)
        List<UsuarioDTO> usuarios = usuarioRepository.findAll().stream()
                .map(this::usuarioToDTO)
                .toList();
        dto.setUsuarios(usuarios);
        
        return dto;
    }

    @Transactional
    public SyncResponseDTO uploadDados(SyncUploadDTO uploadDTO) {
        SyncResponseDTO response = new SyncResponseDTO();
        int usuariosProcessados = 0;
        int inscricoesProcessadas = 0;
        int presencasProcessadas = 0;
        int erros = 0;

        // Processar usuários
        if (uploadDTO.getUsuarios() != null) {
            for (UsuarioSyncDTO usuarioSync : uploadDTO.getUsuarios()) {
                try {
                    processarUsuario(usuarioSync);
                    usuariosProcessados++;
                } catch (Exception e) {
                    erros++;
                    System.err.println("Erro ao processar usuário: " + e.getMessage());
                }
            }
        }

        // Processar inscrições
        if (uploadDTO.getInscricoes() != null) {
            for (InscricaoSyncDTO inscricaoSync : uploadDTO.getInscricoes()) {
                try {
                    processarInscricao(inscricaoSync);
                    inscricoesProcessadas++;
                } catch (Exception e) {
                    erros++;
                    System.err.println("Erro ao processar inscrição: " + e.getMessage());
                }
            }
        }

        // Processar presenças
        if (uploadDTO.getPresencas() != null) {
            for (PresencaSyncDTO presencaSync : uploadDTO.getPresencas()) {
                try {
                    processarPresenca(presencaSync);
                    presencasProcessadas++;
                } catch (Exception e) {
                    erros++;
                    System.err.println("Erro ao processar presença: " + e.getMessage());
                }
            }
        }

        response.setUsuariosProcessados(usuariosProcessados);
        response.setInscricoesProcessadas(inscricoesProcessadas);
        response.setPresencasProcessadas(presencasProcessadas);
        response.setErros(erros);
        response.setMensagem("Sincronização concluída");

        return response;
    }

    private void processarUsuario(UsuarioSyncDTO usuarioSync) {
        Optional<Usuario> usuarioExistente = usuarioRepository.findByEmail(usuarioSync.getEmail());
        
        if (usuarioExistente.isPresent()) {
            // Usuário já existe, usar o do servidor (não sobrescrever)
            return;
        }

        Usuario usuario = new Usuario();
        // Se o ID não for um UUID válido (IDs offline), gerar um novo
        UUID usuarioId = usuarioSync.getId();
        usuario.setId(usuarioId != null ? usuarioId : UUID.randomUUID());
        usuario.setNome(usuarioSync.getNome());
        usuario.setEmail(usuarioSync.getEmail());
        // IMPORTANTE: Fazer hash da senha recebida (vem em texto plano do cliente offline)
        // A senha será hashada pelo backend para segurança
        if (usuarioSync.getSenha() != null && !usuarioSync.getSenha().isEmpty()) {
            usuario.setSenha(passwordEncoder.encode(usuarioSync.getSenha()));
        } else {
            throw new RuntimeException("Senha não fornecida para usuário offline");
        }
        usuario.setCpf(usuarioSync.getCpf());
        usuario.setTelefone(usuarioSync.getTelefone());
        usuario.setDadosCompletos(usuarioSync.getDadosCompletos());
        usuario.setCriadoOffline(usuarioSync.getCriadoOffline());
        usuario.setSincronizado(true);
        usuario.setDataCriacao(usuarioSync.getDataCriacao() != null ? usuarioSync.getDataCriacao() : LocalDateTime.now());
        usuario.setDataAtualizacao(usuarioSync.getDataAtualizacao());

        usuarioRepository.save(usuario);
        
        // Enviar email de boas-vindas após cadastro sincronizado
        // IMPORTANTE: O email será enviado com a data original do cadastro offline
        emailService.enviarEmailBoasVindas(usuario);
    }

    private void processarInscricao(InscricaoSyncDTO inscricaoSync) {
        UUID inscricaoId = inscricaoSync.getId();
        Optional<Inscricao> inscricaoExistente = inscricaoId != null 
            ? inscricaoRepository.findById(inscricaoId) 
            : Optional.empty();
        
        if (inscricaoExistente.isPresent()) {
            // Já existe, apenas marcar como sincronizado
            Inscricao inscricao = inscricaoExistente.get();
            inscricao.setSincronizado(true);
            inscricaoRepository.save(inscricao);
            return;
        }

        // Usar o usuário logado se usuarioId não foi fornecido ou está vazio
        UUID usuarioId = inscricaoSync.getUsuarioId() != null 
            ? inscricaoSync.getUsuarioId() 
            : SecurityUtil.getCurrentUserId();
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        Evento evento = eventoService.findEntityById(inscricaoSync.getEventoId());

        Inscricao inscricao = new Inscricao();
        // Se o ID não for um UUID válido (IDs offline), gerar um novo
        inscricao.setId(inscricaoId != null ? inscricaoId : UUID.randomUUID());
        inscricao.setUsuario(usuario);
        inscricao.setEvento(evento);
        // IMPORTANTE: Preservar a data original do momento offline, não a data de sincronização
        // Esta data será usada no email para mostrar quando a inscrição realmente aconteceu
        inscricao.setDataInscricao(inscricaoSync.getDataInscricao() != null ? inscricaoSync.getDataInscricao() : LocalDateTime.now());
        inscricao.setCancelada(inscricaoSync.getCancelada());
        inscricao.setDataCancelamento(inscricaoSync.getDataCancelamento());
        inscricao.setCriadaOffline(inscricaoSync.getCriadaOffline());
        inscricao.setSincronizado(true);
        inscricao.setDataCriacao(inscricaoSync.getDataCriacao() != null ? inscricaoSync.getDataCriacao() : LocalDateTime.now());
        inscricao.setDataAtualizacao(inscricaoSync.getDataAtualizacao());

        inscricao = inscricaoRepository.save(inscricao);

        // Enviar email de inscrição se não foi cancelada
        // O email usará a dataInscricao preservada acima (momento original offline)
        if (!inscricao.getCancelada()) {
            emailService.enviarEmailInscricao(inscricao);
        }
    }

    private void processarPresenca(PresencaSyncDTO presencaSync) {
        Optional<Presenca> presencaExistente = presencaRepository.findById(presencaSync.getId());
        
        if (presencaExistente.isPresent()) {
            // Já existe, apenas marcar como sincronizado
            Presenca presenca = presencaExistente.get();
            presenca.setSincronizado(true);
            presencaRepository.save(presenca);
            return;
        }

        Inscricao inscricao = inscricaoRepository.findById(presencaSync.getInscricaoId())
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada"));

        Presenca presenca = new Presenca();
        // Se o ID não for um UUID válido (IDs offline), gerar um novo
        UUID presencaId = presencaSync.getId();
        presenca.setId(presencaId != null ? presencaId : UUID.randomUUID());
        presenca.setInscricao(inscricao);
        // IMPORTANTE: Preservar a data original do momento offline, não a data de sincronização
        // Esta data será usada no email para mostrar quando o check-in realmente aconteceu
        presenca.setDataCheckIn(presencaSync.getDataCheckIn() != null ? presencaSync.getDataCheckIn() : LocalDateTime.now());
        presenca.setCriadaOffline(presencaSync.getCriadaOffline());
        presenca.setSincronizado(true);
        presenca.setDataCriacao(presencaSync.getDataCriacao() != null ? presencaSync.getDataCriacao() : LocalDateTime.now());

        presenca = presencaRepository.save(presenca);

        // Enviar email de check-in
        // O email usará a dataCheckIn preservada acima (momento original offline)
        emailService.enviarEmailCheckIn(presenca);
    }

    private UsuarioDTO usuarioToDTO(Usuario usuario) {
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
}

