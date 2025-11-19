package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.dto.InscricaoDTO;
import com.microsservicos.microsservicos.entity.Evento;
import com.microsservicos.microsservicos.entity.Inscricao;
import com.microsservicos.microsservicos.entity.Usuario;
import com.microsservicos.microsservicos.repository.InscricaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InscricaoService {

    @Autowired
    private InscricaoRepository inscricaoRepository;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private EventoService eventoService;

    @Autowired
    private EmailService emailService;

    @Transactional
    public InscricaoDTO criarInscricao(UUID usuarioId, UUID eventoId, boolean offline) {
        // Verificar se já existe uma inscrição não cancelada
        if (inscricaoRepository.existsByUsuarioIdAndEventoIdAndCanceladaFalse(usuarioId, eventoId)) {
            throw new RuntimeException("Usuário já está inscrito neste evento");
        }

        // Verificar se existe uma inscrição cancelada para reativar
        Optional<Inscricao> inscricaoExistente = inscricaoRepository.findByUsuarioIdAndEventoId(usuarioId, eventoId);

        Inscricao inscricao;
        if (inscricaoExistente.isPresent() && inscricaoExistente.get().getCancelada()) {
            // Reativar inscrição cancelada
            inscricao = inscricaoExistente.get();
            inscricao.setCancelada(false);
            inscricao.setDataCancelamento(null);
            inscricao.setDataInscricao(LocalDateTime.now()); // Atualizar data de inscrição
            inscricao.setCriadaOffline(offline);
            inscricao.setSincronizado(!offline);
            inscricao = inscricaoRepository.save(inscricao);
        } else {
            // Criar nova inscrição
            Usuario usuario = usuarioService.findEntityById(usuarioId);
            Evento evento = eventoService.findEntityById(eventoId);

            inscricao = new Inscricao();
            inscricao.setUsuario(usuario);
            inscricao.setEvento(evento);
            inscricao.setCriadaOffline(offline);
            inscricao.setSincronizado(!offline);

            inscricao = inscricaoRepository.save(inscricao);
        }

        // Enviar email apenas se não for offline
        if (!offline) {
            emailService.enviarEmailInscricao(inscricao);
        }

        return toDTO(inscricao);
    }

    public InscricaoDTO buscarPorId(UUID id) {
        Inscricao inscricao = inscricaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada"));
        return toDTO(inscricao);
    }

    public List<InscricaoDTO> buscarPorUsuario(UUID usuarioId) {
        return inscricaoRepository.findByUsuarioId(usuarioId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelarInscricao(UUID id) {
        Inscricao inscricao = inscricaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada"));

        if (inscricao.getCancelada()) {
            throw new RuntimeException("Inscrição já está cancelada");
        }

        inscricao.setCancelada(true);
        inscricao.setDataCancelamento(LocalDateTime.now());
        inscricao = inscricaoRepository.save(inscricao);

        emailService.enviarEmailCancelamento(inscricao);
    }

    public List<InscricaoDTO> listarNaoSincronizadas() {
        return inscricaoRepository.findBySincronizadoFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private InscricaoDTO toDTO(Inscricao inscricao) {
        InscricaoDTO dto = new InscricaoDTO();
        dto.setId(inscricao.getId());
        dto.setUsuarioId(inscricao.getUsuario().getId());
        dto.setUsuarioNome(inscricao.getUsuario().getNome());
        dto.setUsuarioEmail(inscricao.getUsuario().getEmail());
        dto.setEventoId(inscricao.getEvento().getId());
        dto.setEventoNome(inscricao.getEvento().getNome());
        dto.setDataInscricao(inscricao.getDataInscricao());
        dto.setCancelada(inscricao.getCancelada());
        dto.setDataCancelamento(inscricao.getDataCancelamento());
        dto.setCriadaOffline(inscricao.getCriadaOffline());
        dto.setSincronizado(inscricao.getSincronizado());
        dto.setDataCriacao(inscricao.getDataCriacao());
        dto.setDataAtualizacao(inscricao.getDataAtualizacao());
        return dto;
    }

    public Inscricao findEntityById(UUID id) {
        return inscricaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada"));
    }
}

