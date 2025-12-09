import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/store';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '@/store/slices/authSlice';
import api from '@/api/client';
import { LoginRequest, LoginResponse } from '@/types';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch(loginStart());
      const response = await api.post<LoginResponse>('/auth/login', credentials);

      const { token, refreshToken, user } = response.data;
      localStorage.setItem('refreshToken', refreshToken);

      dispatch(loginSuccess({ user, token }));
      toast.success('Connexion réussie');

      if (user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      dispatch(loginFailure());
      toast.error(error.response?.data?.error || 'Erreur de connexion');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logoutAction());
      navigate('/login');
      toast.info('Déconnexion réussie');
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };
};
