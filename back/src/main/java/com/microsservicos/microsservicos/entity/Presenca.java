package com.microsservicos.microsservicos.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "presencas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Presenca {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscricao_id", nullable = false)
    private Inscricao inscricao;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCheckIn;

    @Column(nullable = false)
    private Boolean criadaOffline = false;

    @Column(nullable = false)
    private Boolean sincronizado = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @PrePersist
    protected void onCreate() {
        if (dataCheckIn == null) {
            dataCheckIn = LocalDateTime.now();
        }
        dataCriacao = LocalDateTime.now();
    }
}

