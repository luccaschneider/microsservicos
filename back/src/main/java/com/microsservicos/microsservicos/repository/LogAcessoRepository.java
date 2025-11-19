package com.microsservicos.microsservicos.repository;

import com.microsservicos.microsservicos.entity.LogAcesso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LogAcessoRepository extends JpaRepository<LogAcesso, UUID> {
    List<LogAcesso> findByUsuarioId(UUID usuarioId);
    List<LogAcesso> findByEndpoint(String endpoint);
}

