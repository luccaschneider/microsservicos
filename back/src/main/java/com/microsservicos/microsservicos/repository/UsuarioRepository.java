package com.microsservicos.microsservicos.repository;

import com.microsservicos.microsservicos.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByCpf(String cpf);
    List<Usuario> findBySincronizadoFalse();
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
}

