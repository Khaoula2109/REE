import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Key, Search } from 'lucide-react';
import axios from '../../lib/axios';
import { User, UserRole } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { formatDateTime, formatLastName, formatFirstName } from '../../lib/utils';

const userSchema = z.object({
  lastName: z.string().min(1, 'Nom requis'),
  firstName: z.string().min(1, 'Prénom requis'),
  email: z.string().email('Email invalide'),
  role: z.enum([UserRole.SUPERADMIN, UserRole.USER]),
});

type UserFormData = z.infer<typeof userSchema>;

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<User[]>('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      reset({
        lastName: user.lastName,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
      });
    } else {
      setSelectedUser(null);
      reset({
        lastName: '',
        firstName: '',
        email: '',
        role: UserRole.USER,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    reset();
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (selectedUser) {
        await axios.put(`/users/${selectedUser.id}`, data);
        toast.success('Utilisateur modifié avec succès');
      } else {
        await axios.post('/users', data);
        toast.success('Utilisateur créé avec succès. Un email a été envoyé.');
      }
      handleCloseModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Une erreur est survenue');
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Réinitialiser le mot de passe de ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      await axios.post(`/users/${user.id}/reset-password`);
      toast.success('Mot de passe réinitialisé. Un email a été envoyé.');
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await axios.delete(`/users/${selectedUser.id}`);
      toast.success('Utilisateur supprimé avec succès');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérer les utilisateurs et leurs permissions
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvel Utilisateur
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Tous les rôles</option>
            <option value={UserRole.SUPERADMIN}>Superadmin</option>
            <option value={UserRole.USER}>Utilisateur</option>
          </select>
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg overflow-hidden"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.lastName.toUpperCase()} {user.firstName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.role === UserRole.SUPERADMIN ? 'primary' : 'info'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt && formatDateTime(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-accent-600 hover:text-accent-900"
                        title="Réinitialiser le mot de passe"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <EmptyState
          title="Aucun utilisateur trouvé"
          description="Commencez par créer un nouvel utilisateur"
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Utilisateur
            </Button>
          }
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom <span className="text-xs text-gray-500">(sera converti en MAJUSCULES)</span>
            </label>
            <input
              {...register('lastName')}
              type="text"
              onChange={(e) => {
                const formatted = formatLastName(e.target.value);
                setValue('lastName', formatted);
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm uppercase"
              placeholder="Ex: AIT MOHAMED, ES-SERGHINI"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prénom <span className="text-xs text-gray-500">(première lettre en majuscule)</span>
            </label>
            <input
              {...register('firstName')}
              type="text"
              onChange={(e) => {
                const formatted = formatFirstName(e.target.value);
                setValue('firstName', formatted);
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Ex: Mohamed-Amine, Fatima Ezzahra"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email')}
              type="email"
              disabled={!!selectedUser}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rôle</label>
            <select
              {...register('role')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value={UserRole.USER}>Utilisateur</option>
              <option value={UserRole.SUPERADMIN}>Superadmin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {!selectedUser && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-700">
                Un mot de passe sera généré automatiquement et envoyé par email à l'utilisateur.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {selectedUser ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
            <strong>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </strong>
            ? Cette action est irréversible.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
