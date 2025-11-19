package com.microsservicos.microsservicos.repository;

import com.microsservicos.microsservicos.entity.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PresencaRepository extends JpaRepository<Presenca, UUID> {
    Optional<Presenca> findByInscricaoId(UUID inscricaoId);
    List<Presenca> findBySincronizadoFalse();
    boolean existsByInscricaoId(UUID inscricaoId);
}

