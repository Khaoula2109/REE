import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { cn, getInitials } from '../lib/utils';
import toast from 'react-hot-toast';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Gestion des <span className="text-accent-500">Relevés</span>
          </h2>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white font-semibold">
                {user && getInitials(user.firstName, user.lastName)}
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                  aria-hidden="true"
                >
                  {user?.firstName} {user?.lastName}
                </span>
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-primary-600 mt-1">{user?.role}</p>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/change-password')}
                      className={cn(
                        active ? 'bg-gray-50' : '',
                        'flex w-full items-center px-3 py-2 text-sm text-gray-700'
                      )}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Changer mot de passe
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={cn(
                        active ? 'bg-gray-50' : '',
                        'flex w-full items-center px-3 py-2 text-sm text-red-600'
                      )}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Déconnexion
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;
