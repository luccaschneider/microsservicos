package com.microsservicos.microsservicos.repository;

import com.microsservicos.microsservicos.entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventoRepository extends JpaRepository<Evento, UUID> {
    List<Evento> findByAtivoTrue();
    
    @Query("SELECT e FROM Evento e WHERE e.ativo = true AND e.dataFim >= :agora ORDER BY e.dataInicio ASC")
    List<Evento> findVigentes(LocalDateTime agora);
    
    @Query("SELECT e FROM Evento e WHERE e.ativo = true AND e.dataInicio <= :agora AND e.dataFim >= :agora ORDER BY e.dataInicio ASC")
    List<Evento> findEmAndamento(LocalDateTime agora);
}

