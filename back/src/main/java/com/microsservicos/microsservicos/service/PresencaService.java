package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.dto.PresencaDTO;
import com.microsservicos.microsservicos.entity.Inscricao;
import com.microsservicos.microsservicos.entity.Presenca;
import com.microsservicos.microsservicos.repository.InscricaoRepository;
import com.microsservicos.microsservicos.repository.PresencaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PresencaService {

    @Autowired
    private PresencaRepository presencaRepository;

    @Autowired
    private InscricaoRepository inscricaoRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public PresencaDTO registrarPresenca(UUID inscricaoId, boolean offline) {
        if (presencaRepository.existsByInscricaoId(inscricaoId)) {
            throw new RuntimeException("Presença já registrada para esta inscrição");
        }

        Inscricao inscricao = inscricaoRepository.findById(inscricaoId)
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada"));

        if (inscricao.getCancelada()) {
            throw new RuntimeException("Não é possível registrar presença para inscrição cancelada");
        }

        Presenca presenca = new Presenca();
        presenca.setInscricao(inscricao);
        presenca.setCriadaOffline(offline);
        presenca.setSincronizado(!offline);

        presenca = presencaRepository.save(presenca);

        // Enviar email apenas se não for offline
        if (!offline) {
            emailService.enviarEmailCheckIn(presenca);
        }

        return toDTO(presenca);
    }

    @Transactional
    public PresencaDTO registrarPresencaPorUsuarioEEvento(UUID usuarioId, UUID eventoId, boolean offline) {
        Inscricao inscricao = inscricaoRepository.findByUsuarioIdAndEventoId(usuarioId, eventoId)
                .orElseThrow(() -> new RuntimeException("Inscrição não encontrada"));

        return registrarPresenca(inscricao.getId(), offline);
    }

    public PresencaDTO buscarPorInscricao(UUID inscricaoId) {
        Presenca presenca = presencaRepository.findByInscricaoId(inscricaoId)
                .orElseThrow(() -> new RuntimeException("Presença não encontrada"));
        return toDTO(presenca);
    }

    public List<PresencaDTO> listarNaoSincronizadas() {
        return presencaRepository.findBySincronizadoFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private PresencaDTO toDTO(Presenca presenca) {
        PresencaDTO dto = new PresencaDTO();
        dto.setId(presenca.getId());
        dto.setInscricaoId(presenca.getInscricao().getId());
        dto.setUsuarioId(presenca.getInscricao().getUsuario().getId());
        dto.setUsuarioNome(presenca.getInscricao().getUsuario().getNome());
        dto.setEventoId(presenca.getInscricao().getEvento().getId());
        dto.setEventoNome(presenca.getInscricao().getEvento().getNome());
        dto.setDataCheckIn(presenca.getDataCheckIn());
        dto.setCriadaOffline(presenca.getCriadaOffline());
        dto.setSincronizado(presenca.getSincronizado());
        dto.setDataCriacao(presenca.getDataCriacao());
        return dto;
    }
}

