import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import { generateRandomPassword } from '../utils/passwordGenerator';
import { sendEmail } from '../config/email';
import { Op } from 'sequelize';

/**
 * Get all users (SUPERADMIN only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, sortBy = 'lastName', order = 'ASC' } = req.query;

    const whereClause: any = {};
    if (role) {
      whereClause.role = role;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [[sortBy as string, order as string]],
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

/**
 * Create new user (SUPERADMIN only)
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lastName, firstName, email, role = UserRole.USER } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' });
      return;
    }

    // Generate random password
    const password = generateRandomPassword();

    // Create user
    const user = await User.create({
      lastName,
      firstName,
      email,
      password,
      role,
      mustChangePassword: true,
    });

    // Send email with credentials
    await sendEmail({
      to: user.email,
      subject: 'REE - Bienvenue! Vos identifiants de connexion',
      text: `Bonjour ${user.getFormattedName()},\n\nVotre compte a été créé avec succès.\n\nEmail: ${user.email}\nMot de passe temporaire: ${password}\n\nVous devrez changer votre mot de passe lors de votre première connexion.\n\nCordialement,\nL'équipe REE`,
      html: `
        <h2>Bienvenue sur REE!</h2>
        <p>Bonjour ${user.getFormattedName()},</p>
        <p>Votre compte a été créé avec succès.</p>
        <p><strong>Email:</strong> ${user.email}<br>
        <strong>Mot de passe temporaire:</strong> ${password}</p>
        <p>Vous devrez changer votre mot de passe lors de votre première connexion.</p>
        <p>Cordialement,<br>L'équipe REE</p>
      `,
    });

    res.status(201).json({
      id: user.id,
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
  }
};

/**
 * Update user (SUPERADMIN only)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lastName, firstName, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Update fields
    if (lastName !== undefined) user.lastName = lastName;
    if (firstName !== undefined) user.firstName = firstName;
    if (role !== undefined) user.role = role;

    await user.save();

    res.json({
      id: user.id,
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
};

/**
 * Reset user password (SUPERADMIN only)
 */
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    // Generate new password
    const newPassword = generateRandomPassword();

    // Update user
    user.password = newPassword;
    user.mustChangePassword = true;
    await user.save();

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'REE - Réinitialisation de mot de passe',
      text: `Bonjour ${user.getFormattedName()},\n\nVotre mot de passe a été réinitialisé.\n\nNouveau mot de passe temporaire: ${newPassword}\n\nVous devrez le changer lors de votre prochaine connexion.\n\nCordialement,\nL'équipe REE`,
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${user.getFormattedName()},</p>
        <p>Votre mot de passe a été réinitialisé.</p>
        <p><strong>Nouveau mot de passe temporaire:</strong> ${newPassword}</p>
        <p>Vous devrez le changer lors de votre prochaine connexion.</p>
        <p>Cordialement,<br>L'équipe REE</p>
      `,
    });

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
};

/**
 * Delete user (SUPERADMIN only)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    await user.destroy();

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
};
