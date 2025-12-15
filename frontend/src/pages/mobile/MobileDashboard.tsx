import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, Award } from 'lucide-react';
import axios from '../../lib/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface AgentStats {
  agent: {
    id: number;
    name: string;
    district: string;
  };
  stats: {
    today: number;
    thisMonth: number;
    total: number;
    averagePerDay: number;
    dailyGoal: number;
    todayProgress: number;
  };
}

const MobileDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<AgentStats>('/mobile/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!stats) return null;

  const progressColor = stats.stats.todayProgress >= 100
    ? 'bg-green-500'
    : stats.stats.todayProgress >= 50
    ? 'bg-yellow-500'
    : 'bg-red-500';

  return (
    <div className="p-4 space-y-4">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-2">Bonjour!</h2>
        <p className="text-primary-100 text-lg">{stats.agent.name}</p>
        <p className="text-primary-200 text-sm mt-1">Quartier: {stats.agent.district}</p>
      </motion.div>

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Objectif du jour</h3>
          </div>
          <span className="text-2xl font-bold text-primary-600">
            {stats.stats.today}/{stats.stats.dailyGoal}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stats.stats.todayProgress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${progressColor} transition-colors`}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center">
          {stats.stats.todayProgress}% complété
        </p>

        {/* Start Work Button */}
        <button
          onClick={() => navigate('/mobile/addresses')}
          className="mt-4 w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition shadow-md"
        >
          {stats.stats.today === 0 ? 'Commencer ma tournée' : 'Continuer ma tournée'}
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-600">Ce mois</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.stats.thisMonth}</p>
          <p className="text-xs text-gray-500 mt-1">relevés effectués</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="text-sm font-medium text-gray-600">Moyenne/jour</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.stats.averagePerDay}</p>
          <p className="text-xs text-gray-500 mt-1">sur 30 jours</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-md col-span-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <h4 className="text-sm font-medium text-gray-600">Total de relevés</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">depuis le début</p>
        </motion.div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 rounded-xl p-4 border border-blue-200"
      >
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Astuce du jour</h4>
        <p className="text-sm text-blue-800">
          {stats.stats.today < 20
            ? 'Bon début de journée! Continuez sur cette lancée pour atteindre votre objectif.'
            : stats.stats.today < 40
            ? 'Excellent travail! Vous êtes sur la bonne voie pour atteindre les 50 relevés.'
            : stats.stats.today < 50
            ? 'Bravo! Plus que quelques relevés pour atteindre votre objectif quotidien!'
            : 'Objectif atteint! Félicitations pour votre excellent travail 🎉'}
        </p>
      </motion.div>
    </div>
  );
};

export default MobileDashboard;
