package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.dto.EventoDTO;
import com.microsservicos.microsservicos.entity.Evento;
import com.microsservicos.microsservicos.repository.EventoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventoService {

    @Autowired
    private EventoRepository eventoRepository;

    public List<EventoDTO> listarEventos() {
        LocalDateTime agora = LocalDateTime.now();
        return eventoRepository.findVigentes(agora).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public EventoDTO buscarPorId(UUID id) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        return toDTO(evento);
    }

    public String buscarTemplateCertificado(UUID eventoId) {
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
        return evento.getTemplateCertificado();
    }

    private EventoDTO toDTO(Evento evento) {
        EventoDTO dto = new EventoDTO();
        dto.setId(evento.getId());
        dto.setNome(evento.getNome());
        dto.setDescricao(evento.getDescricao());
        dto.setDataInicio(evento.getDataInicio());
        dto.setDataFim(evento.getDataFim());
        dto.setAtivo(evento.getAtivo());
        dto.setTemplateCertificado(evento.getTemplateCertificado());
        dto.setDataCriacao(evento.getDataCriacao());
        dto.setDataAtualizacao(evento.getDataAtualizacao());
        return dto;
    }

    public Evento findEntityById(UUID id) {
        return eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento não encontrado"));
    }
}

