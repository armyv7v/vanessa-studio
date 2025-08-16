/**
 * Wrapper para el envío de correos usando SendGrid.
 *
 * Variables de entorno:
 *   - SENDGRID_API_KEY
 *   - EMAIL_FROM
 */

import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Envía un correo simple de texto‑HTML.
 *
 * @param {string} to      → destinatario
 * @param {string} subject → asunto
 * @param {string} html    → cuerpo HTML
 */
export async function sendEmail(to, subject, html) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject,
    html,
  };
  await sgMail.send(msg);
}