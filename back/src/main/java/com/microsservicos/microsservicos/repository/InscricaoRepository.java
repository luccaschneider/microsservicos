package com.microsservicos.microsservicos.repository;

import com.microsservicos.microsservicos.entity.Inscricao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InscricaoRepository extends JpaRepository<Inscricao, UUID> {
    List<Inscricao> findByUsuarioId(UUID usuarioId);
    List<Inscricao> findByEventoId(UUID eventoId);
    List<Inscricao> findBySincronizadoFalse();
    Optional<Inscricao> findByUsuarioIdAndEventoId(UUID usuarioId, UUID eventoId);
    boolean existsByUsuarioIdAndEventoId(UUID usuarioId, UUID eventoId);
    Optional<Inscricao> findByUsuarioIdAndEventoIdAndCanceladaFalse(UUID usuarioId, UUID eventoId);
    boolean existsByUsuarioIdAndEventoIdAndCanceladaFalse(UUID usuarioId, UUID eventoId);
}

