import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  Gauge,
  BarChart3,
  UserCircle,
} from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { cn } from '../lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const navigation = [
    { name: 'Tableau de Bord', href: '/', icon: LayoutDashboard },
    { name: 'Relevés', href: '/readings', icon: FileText },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Compteurs', href: '/meters', icon: Gauge },
    { name: 'Rapports', href: '/reports', icon: BarChart3 },
    ...(user?.role === 'SUPERADMIN'
      ? [{ name: 'Utilisateurs', href: '/users', icon: UserCircle }]
      : []),
  ];

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-primary-600 to-primary-700 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-white"
          >
            <h1 className="text-2xl font-bold">REE</h1>
            <p className="text-xs text-primary-100">Rabat Energie & Eau</p>
          </motion.div>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item, index) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <motion.li
                      key={item.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        className={cn(
                          isActive
                            ? 'bg-primary-700 text-white'
                            : 'text-primary-100 hover:text-white hover:bg-primary-600',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-white'
                              : 'text-primary-200 group-hover:text-white',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
