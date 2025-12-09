import nodemailer from 'nodemailer';
import { config } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: config.email.user
        ? {
            user: config.email.user,
            pass: config.email.password
          }
        : undefined,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to,
        subject,
        html
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string, password: string): Promise<boolean> {
    const subject = 'Bienvenue sur REE - Système de Relevés';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1E40AF 0%, #F59E0B 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #1E40AF; margin: 20px 0; }
          .button { display: inline-block; background: #1E40AF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue chez REE</h1>
            <p>Système de Gestion des Relevés</p>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName},</h2>
            <p>Votre compte a été créé avec succès sur le système REE - Gestion des Relevés.</p>

            <div class="credentials">
              <h3>Vos identifiants de connexion :</h3>
              <p><strong>Email :</strong> ${email}</p>
              <p><strong>Mot de passe temporaire :</strong> ${password}</p>
            </div>

            <p><strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.</p>

            <p>Vous pouvez accéder à votre compte en cliquant sur le bouton ci-dessous :</p>
            <a href="https://localhost:5173/login" class="button">Se connecter</a>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p><strong>Conseils de sécurité :</strong></p>
              <ul>
                <li>Changez votre mot de passe dès la première connexion</li>
                <li>Utilisez un mot de passe fort et unique</li>
                <li>Ne partagez jamais vos identifiants</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 REE - Rabat Energie & Eau. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, firstName: string, newPassword: string): Promise<boolean> {
    const subject = 'Réinitialisation de votre mot de passe REE';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1E40AF 0%, #F59E0B 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-left: 4px solid #F59E0B; margin: 20px 0; }
          .button { display: inline-block; background: #1E40AF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName},</h2>
            <p>Votre mot de passe a été réinitialisé par un administrateur.</p>

            <div class="credentials">
              <h3>Votre nouveau mot de passe temporaire :</h3>
              <p><strong>${newPassword}</strong></p>
            </div>

            <p><strong>⚠️ Important :</strong> Vous devrez changer ce mot de passe lors de votre prochaine connexion.</p>

            <a href="https://localhost:5173/login" class="button">Se connecter</a>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p><strong>Si vous n'êtes pas à l'origine de cette demande</strong>, veuillez contacter immédiatement votre administrateur système.</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 REE - Rabat Energie & Eau. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, subject, html);
  }
}

export default new EmailService();
