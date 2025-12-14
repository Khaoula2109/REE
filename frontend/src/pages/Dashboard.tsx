import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity, Droplet, Zap } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from '../lib/axios';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { CoverageData, AgentReadingStats, ConsumptionData, OverallStats } from '../types';
import { getCoverageColor } from '../lib/utils';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [agentStats, setAgentStats] = useState<AgentReadingStats[]>([]);
  const [consumptionData, setConsumptionData] = useState<ConsumptionData[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, coverageRes, agentsRes, consumptionRes] = await Promise.all([
        axios.get<OverallStats>('/dashboard/stats'),
        axios.get<CoverageData[]>('/dashboard/coverage-rate'),
        axios.get<AgentReadingStats[]>('/dashboard/readings-per-agent'),
        axios.get<ConsumptionData[]>('/dashboard/consumption-evolution'),
      ]);

      setStats(statsRes.data);
      setCoverageData(coverageRes.data);
      setAgentStats(agentsRes.data);
      setConsumptionData(consumptionRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  // Prepare coverage pie chart data
  const coveragePieData = coverageData.map((d) => ({
    name: d.districtName,
    value: d.coverageRate,
    meters: d.totalMeters,
    readings: d.readingsCount,
  }));

  // Colors for coverage chart
  const getCoverageChartColor = (rate: number) => {
    if (rate >= 80) return '#10B981';
    if (rate >= 50) return '#F59E0B';
    return '#EF4444';
  };

  // Prepare agent bar chart data
  const agentBarData = agentStats.slice(0, 10).map((a) => ({
    name: a.agentName.split(' ')[1], // Last name only for chart
    relevés: a.avgReadingsPerDay,
    quartier: a.districtName,
  }));

  // Prepare consumption line chart data (group by month)
  const consumptionByMonth = consumptionData.reduce((acc, curr) => {
    const existing = acc.find((d) => d.month === curr.month);
    if (existing) {
      if (curr.meterType === 'WATER') {
        existing.eau = curr.avgConsumption;
      } else {
        existing.electricite = curr.avgConsumption;
      }
    } else {
      acc.push({
        month: curr.month,
        eau: curr.meterType === 'WATER' ? curr.avgConsumption : 0,
        electricite: curr.meterType === 'ELECTRICITY' ? curr.avgConsumption : 0,
      });
    }
    return acc;
  }, [] as Array<{ month: string; eau: number; electricite: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble de l'activité des relevés
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Compteurs"
          value={stats?.totalMeters || 0}
          icon={BarChart3}
          color="primary"
        />
        <StatCard
          title="Relevés ce mois"
          value={stats?.monthlyReadings || 0}
          icon={Activity}
          color="accent"
        />
        <StatCard
          title="Agents Actifs"
          value={stats?.totalAgents || 0}
          icon={Users}
          color="success"
        />
        <StatCard
          title="Consommation Moy."
          value={stats?.avgConsumption ? Number(stats.avgConsumption).toFixed(2) : 0 || 0}
          icon={TrendingUp}
          color="warning"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coverage Rate by District */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Taux de Couverture par Quartier
          </h3>
          {coveragePieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={coveragePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {coveragePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCoverageChartColor(entry.value)} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Taux: {data.value.toFixed(2)}%</p>
                            <p className="text-sm">Compteurs: {data.meters}</p>
                            <p className="text-sm">Relevés: {data.readings}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
                  <span>Bon (&gt;80%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1" />
                  <span>Moyen (50-80%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1" />
                  <span>Faible (&lt;50%)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Aucune donnée disponible
            </div>
          )}
        </motion.div>

        {/* Readings per Agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Relevés Moyens par Agent par Jour
          </h3>
          {agentBarData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Quartier: {data.quartier}</p>
                            <p className="text-sm">Relevés/jour: {data.relevés.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="relevés" fill="#1E40AF" />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Objectif: 50 relevés/jour par agent
              </p>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Aucune donnée disponible
            </div>
          )}
        </motion.div>
      </div>

      {/* Consumption Evolution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white p-6 rounded-lg shadow"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Évolution de la Consommation Moyenne Mensuelle
        </h3>
        {consumptionByMonth.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={consumptionByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      return (
                        <div className="bg-white p-3 border rounded shadow-lg">
                          <p className="font-semibold">{payload[0].payload.month}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {Number(entry.value).toFixed(2)}{' '}
                              {entry.name === 'Eau' ? 'm³' : 'kWh'}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="eau"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Eau (m³)"
                  dot={{ fill: '#3B82F6' }}
                />
                <Line
                  type="monotone"
                  dataKey="electricite"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Électricité (kWh)"
                  dot={{ fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center">
                <Droplet className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm">Eau</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm">Électricité</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            Aucune donnée disponible
          </div>
        )}
      </motion.div>

      {/* Quick Stats Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white shadow rounded-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Résumé par Quartier</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quartier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compteurs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relevés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux Couverture
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coverageData.map((district) => (
                <tr key={district.districtId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {district.districtName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {district.totalMeters}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {district.readingsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCoverageColor(
                        district.coverageRate
                      )}`}
                    >
                      {Number(district.coverageRate).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
