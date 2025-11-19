package com.microsservicos.microsservicos.util;

import com.microsservicos.microsservicos.entity.Inscricao;
import com.microsservicos.microsservicos.entity.Presenca;
import com.microsservicos.microsservicos.entity.Usuario;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class EmailTemplate {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public String templateInscricao(Inscricao inscricao) {
        String dataInicio = inscricao.getEvento().getDataInicio().format(DATE_FORMATTER);
        String dataFim = inscricao.getEvento().getDataFim() != null 
            ? inscricao.getEvento().getDataFim().format(DATE_FORMATTER) 
            : "A definir";
        String dataInscricao = inscricao.getDataInscricao().format(DATE_FORMATTER);
        
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
            ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
            ".header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
            ".content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
            ".info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }" +
            ".info-item { margin: 10px 0; }" +
            ".info-label { font-weight: bold; color: #667eea; }" +
            ".footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>✓ Inscrição Confirmada</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<p>Olá <strong>%s</strong>,</p>" +
            "<p>Sua inscrição no evento foi confirmada com sucesso!</p>" +
            "<div class='info-box'>" +
            "<div class='info-item'><span class='info-label'>Evento:</span> %s</div>" +
            "<div class='info-item'><span class='info-label'>Data de Início:</span> %s</div>" +
            "<div class='info-item'><span class='info-label'>Data de Término:</span> %s</div>" +
            "<div class='info-item'><span class='info-label'>Data da Inscrição:</span> %s</div>" +
            "</div>" +
            "<p>Guarde este e-mail como comprovante de sua inscrição.</p>" +
            "<p>Nos vemos no evento!</p>" +
            "<div class='footer'>" +
            "<p>Atenciosamente,<br><strong>Equipe EventHub</strong></p>" +
            "<p>Sistema de Gestão de Eventos</p>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>",
            inscricao.getUsuario().getNome(),
            inscricao.getEvento().getNome(),
            dataInicio,
            dataFim,
            dataInscricao
        );
    }

    public String templateCancelamento(Inscricao inscricao) {
        String dataCancelamento = inscricao.getDataCancelamento() != null 
            ? inscricao.getDataCancelamento().format(DATE_FORMATTER) 
            : LocalDateTime.now().format(DATE_FORMATTER);
        
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
            ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
            ".header { background: linear-gradient(135deg, #f093fb 0%%, #f5576c 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
            ".content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
            ".info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f5576c; }" +
            ".info-item { margin: 10px 0; }" +
            ".info-label { font-weight: bold; color: #f5576c; }" +
            ".footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>✗ Inscrição Cancelada</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<p>Olá <strong>%s</strong>,</p>" +
            "<p>Informamos que sua inscrição no evento foi cancelada conforme solicitado.</p>" +
            "<div class='info-box'>" +
            "<div class='info-item'><span class='info-label'>Evento:</span> %s</div>" +
            "<div class='info-item'><span class='info-label'>Data do Cancelamento:</span> %s</div>" +
            "</div>" +
            "<p>Esperamos vê-lo em nossos próximos eventos!</p>" +
            "<p>Se você tiver alguma dúvida ou precisar de mais informações, não hesite em entrar em contato conosco.</p>" +
            "<div class='footer'>" +
            "<p>Atenciosamente,<br><strong>Equipe EventHub</strong></p>" +
            "<p>Sistema de Gestão de Eventos</p>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>",
            inscricao.getUsuario().getNome(),
            inscricao.getEvento().getNome(),
            dataCancelamento
        );
    }

    public String templateCheckIn(Presenca presenca) {
        String dataCheckIn = presenca.getDataCheckIn() != null 
            ? presenca.getDataCheckIn().format(DATE_FORMATTER) 
            : "Agora";
        
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
            ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
            ".header { background: linear-gradient(135deg, #4facfe 0%%, #00f2fe 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
            ".content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
            ".info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4facfe; }" +
            ".info-item { margin: 10px 0; }" +
            ".info-label { font-weight: bold; color: #4facfe; }" +
            ".footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>✓ Check-in Realizado</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<p>Olá <strong>%s</strong>,</p>" +
            "<p>Seu check-in no evento foi registrado com sucesso!</p>" +
            "<div class='info-box'>" +
            "<div class='info-item'><span class='info-label'>Evento:</span> %s</div>" +
            "<div class='info-item'><span class='info-label'>Data do Check-in:</span> %s</div>" +
            "</div>" +
            "<p><strong>Bem-vindo ao evento!</strong></p>" +
            "<p>Esperamos que você tenha uma experiência incrível. Após o encerramento do evento, você poderá emitir seu certificado de participação através do portal.</p>" +
            "<div class='footer'>" +
            "<p>Atenciosamente,<br><strong>Equipe EventHub</strong></p>" +
            "<p>Sistema de Gestão de Eventos</p>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>",
            presenca.getInscricao().getUsuario().getNome(),
            presenca.getInscricao().getEvento().getNome(),
            dataCheckIn
        );
    }

    public String templateBoasVindas(Usuario usuario) {
        String dataCadastro = usuario.getDataCriacao() != null 
            ? usuario.getDataCriacao().format(DATE_FORMATTER) 
            : LocalDateTime.now().format(DATE_FORMATTER);
        
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<style>" +
            "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
            ".container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
            ".header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
            ".content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
            ".info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }" +
            ".info-item { margin: 10px 0; }" +
            ".info-label { font-weight: bold; color: #667eea; }" +
            ".footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'>" +
            "<h1>🎉 Bem-vindo ao EventHub!</h1>" +
            "</div>" +
            "<div class='content'>" +
            "<p>Olá <strong>%s</strong>,</p>" +
            "<p>É com grande prazer que damos as boas-vindas ao <strong>EventHub</strong>!</p>" +
            "<p>Sua conta foi criada com sucesso e você já pode começar a participar dos nossos eventos.</p>" +
            "<div class='info-box'>" +
            "<div class='info-item'><span class='info-label'>Data de Cadastro:</span> %s</div>" +
            "<div class='info-item'><span class='info-label'>Email:</span> %s</div>" +
            "</div>" +
            "<p><strong>O que você pode fazer agora:</strong></p>" +
            "<ul>" +
            "<li>Explorar eventos disponíveis</li>" +
            "<li>Inscrever-se em eventos de seu interesse</li>" +
            "<li>Participar e fazer check-in nos eventos</li>" +
            "<li>Emitir certificados de participação</li>" +
            "</ul>" +
            "<p>Estamos muito felizes em tê-lo conosco e esperamos que você tenha uma experiência incrível!</p>" +
            "<div class='footer'>" +
            "<p>Atenciosamente,<br><strong>Equipe EventHub</strong></p>" +
            "<p>Sistema de Gestão de Eventos</p>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>",
            usuario.getNome(),
            dataCadastro,
            usuario.getEmail()
        );
    }
}

