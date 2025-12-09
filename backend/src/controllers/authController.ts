import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { generateRandomPassword, validatePasswordComplexity } from '../utils/passwordGenerator';
import { sendEmail } from '../config/email';

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      ...tokens,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Token de rafraîchissement manquant' });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findByPk(payload.userId);

    if (!user) {
      res.status(401).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json(tokens);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Token de rafraîchissement invalide ou expiré' });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Non autorisé' });
      return;
    }

    // Validate new password complexity
    const validation = validatePasswordComplexity(newPassword);
    if (!validation.valid) {
      res.status(400).json({ error: 'Mot de passe invalide', errors: validation.errors });
      return;
    }

    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Check current password
    const isPasswordValid = await user.checkPassword(currentPassword);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      return;
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not
      res.json({ message: 'Si l\'email existe, un lien de réinitialisation a été envoyé' });
      return;
    }

    // Generate new password
    const newPassword = generateRandomPassword();

    // Update user
    user.password = newPassword;
    user.mustChangePassword = true;
    await user.save();

    // Send email with new password
    await sendEmail({
      to: user.email,
      subject: 'REE - Réinitialisation de mot de passe',
      text: `Bonjour ${user.getFormattedName()},\n\nVotre nouveau mot de passe temporaire est: ${newPassword}\n\nVous devrez le changer lors de votre prochaine connexion.\n\nCordialement,\nL'équipe REE`,
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${user.getFormattedName()},</p>
        <p>Votre nouveau mot de passe temporaire est:</p>
        <p><strong>${newPassword}</strong></p>
        <p>Vous devrez le changer lors de votre prochaine connexion.</p>
        <p>Cordialement,<br>L'équipe REE</p>
      `,
    });

    res.json({ message: 'Si l\'email existe, un lien de réinitialisation a été envoyé' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
};

/**
 * Logout (client-side only, just return success)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Déconnexion réussie' });
};
