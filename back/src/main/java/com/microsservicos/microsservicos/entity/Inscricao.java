package com.microsservicos.microsservicos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inscricoes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Inscricao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataInscricao;

    @Column(nullable = false)
    private Boolean cancelada = false;

    private LocalDateTime dataCancelamento;

    @Column(nullable = false)
    private Boolean criadaOffline = false;

    @Column(nullable = false)
    private Boolean sincronizado = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    private LocalDateTime dataAtualizacao;

    @PrePersist
    protected void onCreate() {
        if (dataInscricao == null) {
            dataInscricao = LocalDateTime.now();
        }
        dataCriacao = LocalDateTime.now();
        dataAtualizacao = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dataAtualizacao = LocalDateTime.now();
        if (cancelada && dataCancelamento == null) {
            dataCancelamento = LocalDateTime.now();
        }
    }
}

