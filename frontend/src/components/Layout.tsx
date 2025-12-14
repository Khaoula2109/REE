import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useIdleTimer } from '../hooks/useIdleTimer';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const Layout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Auto logout after 10 minutes of inactivity
  useIdleTimer({
    timeout: 10 * 60 * 1000, // 10 minutes
    onIdle: () => {
      toast.error('Session expirée en raison d\'inactivité');
      dispatch(logout());
      navigate('/login');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="py-6 px-4 sm:px-6 lg:px-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default Layout;
