// lib/email.js
import sgMail from '@sendgrid/mail';

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Envía un email usando SendGrid
 * @param {string} to - Email del destinatario
 * @param {string} subject - Asunto del email
 * @param {string} html - Contenido HTML del email
 * @param {string} from - Email del remitente (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendEmail(to, subject, html, from = null) {
  try {
    const fromEmail = from || process.env.SENDGRID_FROM_EMAIL || process.env.STUDIO_EMAIL || 'noreply@tudominio.com';
    
    if (!fromEmail) {
      throw new Error('No se ha configurado un email de remitente');
    }

    const msg = {
      to: to,
      from: fromEmail,
      subject: subject,
      html: html,
    };

    console.log('Preparando envío de email:', {
      to: to,
      from: fromEmail,
      subject: subject
    });

    const response = await sgMail.send(msg);
    
    console.log('Email enviado exitosamente:', {
      statusCode: response[0].statusCode,
      to: to,
      subject: subject
    });
    
    return { success: true, response: response[0] };

  } catch (error) {
    console.error('Error detallado enviando email:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    
    if (error.response) {
      console.error('SendGrid response error:', error.response.body);
    }
    
    return { success: false, error: error.message };
  }
}