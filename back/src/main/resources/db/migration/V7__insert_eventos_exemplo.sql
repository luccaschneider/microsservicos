-- Inserir eventos de exemplo
INSERT INTO eventos (id, nome, descricao, data_inicio, data_fim, ativo, template_certificado, data_criacao, data_atualizacao)
VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        'Workshop de Spring Boot',
        'Workshop completo sobre desenvolvimento com Spring Boot e microsserviços',
        CURRENT_TIMESTAMP + INTERVAL '30 days',
        CURRENT_TIMESTAMP + INTERVAL '30 days' + INTERVAL '8 hours',
        TRUE,
        'Certificado de Participação - Workshop de Spring Boot',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        'Conferência de Arquitetura de Software',
        'Conferência sobre arquiteturas modernas e melhores práticas',
        CURRENT_TIMESTAMP + INTERVAL '60 days',
        CURRENT_TIMESTAMP + INTERVAL '60 days' + INTERVAL '2 days',
        TRUE,
        'Certificado de Participação - Conferência de Arquitetura de Software',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003'::uuid,
        'Curso de Docker e Kubernetes',
        'Curso prático sobre containerização e orquestração',
        CURRENT_TIMESTAMP + INTERVAL '45 days',
        CURRENT_TIMESTAMP + INTERVAL '45 days' + INTERVAL '1 day',
        TRUE,
        'Certificado de Participação - Curso de Docker e Kubernetes',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

