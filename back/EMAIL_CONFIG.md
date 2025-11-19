# Configuração de E-mail

Este documento descreve como configurar o envio de e-mails no sistema.

## Requisitos

O sistema utiliza o Spring Boot Mail para envio de e-mails. A configuração é feita através do arquivo `application.properties`.

## Configuração

### Gmail (Recomendado para desenvolvimento)

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma senha de aplicativo:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Aplicativo" e "E-mail"
   - Selecione "Outro (nome personalizado)" e digite "EventHub"
   - Clique em "Gerar"
   - Copie a senha gerada (16 caracteres)

3. Configure no `application.properties`:

```properties
# SMTP Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=seu-email@gmail.com
spring.mail.password=sua-senha-de-aplicativo
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.from=noreply@eventos.com
```

### Outros provedores SMTP

#### Outlook/Hotmail
```properties
spring.mail.host=smtp-mail.outlook.com
spring.mail.port=587
spring.mail.username=seu-email@outlook.com
spring.mail.password=sua-senha
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.from=noreply@eventos.com
```

#### Servidor SMTP próprio
```properties
spring.mail.host=seu-servidor-smtp.com
spring.mail.port=587
spring.mail.username=seu-usuario
spring.mail.password=sua-senha
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.from=noreply@eventos.com
```

## E-mails Enviados

O sistema envia e-mails automaticamente nos seguintes momentos:

1. **Inscrição Confirmada** - Quando um usuário se inscreve em um evento
2. **Inscrição Cancelada** - Quando um usuário cancela sua inscrição
3. **Check-in Realizado** - Quando a presença é registrada (check-in)

### E-mails na Sincronização Offline

Quando dados são sincronizados após operação offline:
- E-mails de inscrição são enviados para inscrições criadas offline
- E-mails de check-in são enviados para presenças registradas offline

## Testando o Envio de E-mail

### Via API

```bash
POST /emails
Authorization: Bearer {token}
Content-Type: application/json

{
  "destinatario": "teste@example.com",
  "assunto": "Teste de E-mail",
  "corpo": "<h1>Este é um teste</h1>"
}
```

### Via Swagger

1. Acesse: http://localhost:8080/swagger-ui.html
2. Navegue até a seção "E-mails"
3. Use o endpoint `POST /emails` para testar

## Troubleshooting

### Erro: "Authentication failed"

- Verifique se a senha está correta
- Para Gmail, certifique-se de usar uma senha de aplicativo, não a senha da conta
- Verifique se a verificação em duas etapas está ativada

### Erro: "Connection timeout"

- Verifique se a porta está correta (587 para TLS, 465 para SSL)
- Verifique se o firewall não está bloqueando a conexão
- Teste a conectividade: `telnet smtp.gmail.com 587`

### E-mails não estão sendo enviados

- Verifique os logs do servidor para mensagens de erro
- Certifique-se de que o `EmailService` está sendo chamado
- Verifique se o e-mail do destinatário está correto

## Logs

Os erros de envio de e-mail são registrados no console, mas não interrompem o fluxo da aplicação. Verifique os logs para diagnosticar problemas.

