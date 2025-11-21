package com.microsservicos.microsservicos.service;

import com.microsservicos.microsservicos.dto.EmailDTO;
import com.microsservicos.microsservicos.entity.Inscricao;
import com.microsservicos.microsservicos.entity.Presenca;
import com.microsservicos.microsservicos.entity.Usuario;
import com.microsservicos.microsservicos.util.EmailTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailTemplate emailTemplate;

    @Value("${spring.mail.from}")
    private String fromEmail;

    public void enviarEmailInscricao(Inscricao inscricao) {
        try {
            String corpo = emailTemplate.templateInscricao(inscricao);
            enviarEmail(inscricao.getUsuario().getEmail(), "Inscrição Confirmada", corpo);
        } catch (Exception e) {
            // Log do erro mas não interrompe o fluxo
            System.err.println("Erro ao enviar email de inscrição: " + e.getMessage());
        }
    }

    public void enviarEmailCancelamento(Inscricao inscricao) {
        try {
            String corpo = emailTemplate.templateCancelamento(inscricao);
            enviarEmail(inscricao.getUsuario().getEmail(), "Inscrição Cancelada", corpo);
        } catch (Exception e) {
            System.err.println("Erro ao enviar email de cancelamento: " + e.getMessage());
        }
    }

    public void enviarEmailCheckIn(Presenca presenca) {
        try {
            String corpo = emailTemplate.templateCheckIn(presenca);
            enviarEmail(presenca.getInscricao().getUsuario().getEmail(), "Check-in Realizado", corpo);
        } catch (Exception e) {
            System.err.println("Erro ao enviar email de check-in: " + e.getMessage());
        }
    }

    public void enviarEmailBoasVindas(Usuario usuario) {
        try {
            String corpo = emailTemplate.templateBoasVindas(usuario);
            enviarEmail(usuario.getEmail(), "Bem-vindo ao EventHub!", corpo);
        } catch (Exception e) {
            System.err.println("Erro ao enviar email de boas-vindas: " + e.getMessage());
        }
    }

    public void enviarEmailInscricaoComSenha(Inscricao inscricao, String senhaTemporaria) {
        try {
            String corpo = emailTemplate.templateInscricaoComSenha(inscricao, senhaTemporaria);
            enviarEmail(inscricao.getUsuario().getEmail(), "Inscrição Confirmada - Sua Senha de Acesso", corpo);
        } catch (Exception e) {
            // Log do erro mas não interrompe o fluxo
            System.err.println("Erro ao enviar email de inscrição com senha: " + e.getMessage());
        }
    }

    public void enviarEmail(String destinatario, String assunto, String corpo) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(destinatario);
            helper.setSubject(assunto);
            helper.setText(corpo, true);

            mailSender.send(message);
            System.out.println("Email enviado com sucesso para: " + destinatario);
        } catch (Exception e) {
            System.err.println("Erro ao enviar email para " + destinatario + ": " + e.getMessage());
            e.printStackTrace();
            // Não lança exceção para não interromper o fluxo principal
            // throw new RuntimeException("Erro ao enviar email", e);
        }
    }

    public void enviarEmail(EmailDTO emailDTO) {
        enviarEmail(emailDTO.getDestinatario(), emailDTO.getAssunto(), emailDTO.getCorpo());
    }
}

