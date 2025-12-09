import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble de l'activité des relevés
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Compteurs', value: '1,250', icon: BarChart3, color: 'primary' },
          { title: 'Relevés ce mois', value: '856', icon: Activity, color: 'accent' },
          { title: 'Agents Actifs', value: '12', icon: Users, color: 'primary' },
          { title: 'Taux Couverture', value: '68.5%', icon: TrendingUp, color: 'accent' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className={`h-6 w-6 text-${stat.color}-600`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Placeholders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Taux de Couverture par Quartier
          </h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-400">Graphique en cercle - Taux de couverture</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Relevés par Agent
          </h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-400">Graphique en barres - Relevés par agent</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Évolution de la Consommation Moyenne
        </h3>
        <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-400">Graphique en ligne - Évolution mensuelle</p>
        </div>
      </motion.div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Les graphiques interactifs seront implémentés avec Recharts.
              Connectez-vous au backend pour voir les données réelles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
