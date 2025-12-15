import { Outlet, useNavigate } from 'react-router-dom';
import { Home, List, BarChart3, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const MobileLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Déconnexion réussie');
    navigate('/mobile/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-primary-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">REE Mobile</h1>
            <p className="text-sm text-primary-100">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-primary-700 rounded-full transition"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-3 h-16">
          <button
            onClick={() => navigate('/mobile')}
            className="flex flex-col items-center justify-center hover:bg-gray-50 transition"
          >
            <Home className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Accueil</span>
          </button>
          <button
            onClick={() => navigate('/mobile/addresses')}
            className="flex flex-col items-center justify-center hover:bg-gray-50 transition"
          >
            <List className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Tournée</span>
          </button>
          <button
            onClick={() => navigate('/mobile/history')}
            className="flex flex-col items-center justify-center hover:bg-gray-50 transition"
          >
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span className="text-xs text-gray-600 mt-1">Historique</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
