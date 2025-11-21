package com.microsservicos.microsservicos.repository;

import com.microsservicos.microsservicos.entity.LogAcesso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LogAcessoRepository extends JpaRepository<LogAcesso, UUID>, JpaSpecificationExecutor<LogAcesso> {
    List<LogAcesso> findByUsuarioId(UUID usuarioId);
    Page<LogAcesso> findByUsuarioId(UUID usuarioId, Pageable pageable);
    List<LogAcesso> findByEndpoint(String endpoint);
}

