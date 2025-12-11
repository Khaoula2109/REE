import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, MapPin, TrendingUp, Save } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import axios from '../../lib/axios';
import { Agent, AgentPerformance, District } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { getInitials } from '../../lib/utils';
import toast from 'react-hot-toast';

type TimePeriod = '1week' | '1month' | '3months' | '6months' | '1year';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [performance, setPerformance] = useState<AgentPerformance | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<number>(0);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1month');

  useEffect(() => {
    fetchAgent();
    fetchDistricts();
  }, [id]);

  useEffect(() => {
    if (agent) {
      fetchPerformance();
    }
  }, [agent, timePeriod]);

  const fetchAgent = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<Agent>(`/agents/${id}`);
      setAgent(response.data);
      setSelectedDistrict(response.data.districtId);
    } catch (error) {
      toast.error("Erreur lors du chargement de l'agent");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await axios.get<District[]>('/districts');
      setDistricts(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des quartiers');
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await axios.get<AgentPerformance>(
        `/agents/${id}/performance?period=${timePeriod}`
      );
      setPerformance(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des performances');
    }
  };

  const handleSaveDistrict = async () => {
    if (!agent) return;

    try {
      setIsSaving(true);
      await axios.put(`/agents/${id}`, {
        districtId: selectedDistrict,
      });
      toast.success('Quartier mis à jour avec succès');
      fetchAgent();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du quartier');
    } finally {
      setIsSaving(false);
    }
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    const labels = {
      '1week': '1 Semaine',
      '1month': '1 Mois',
      '3months': '3 Mois',
      '6months': '6 Mois',
      '1year': '1 An',
    };
    return labels[period];
  };

  if (isLoading) return <LoadingSpinner />;

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Agent non trouvé</p>
        <Button onClick={() => navigate('/agents')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/agents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white text-lg font-semibold">
            {getInitials(agent.firstName, agent.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {agent.lastName.toUpperCase()} {agent.firstName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Agent de relevé</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Agent Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations</h2>

            <div className="space-y-4">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom Complet</p>
                  <p className="text-base text-gray-900">
                    {agent.lastName.toUpperCase()} {agent.firstName}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Téléphone Personnel</p>
                  <p className="text-base text-gray-900">{agent.personalPhone}</p>
                </div>
              </div>

              {agent.professionalPhone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Téléphone Professionnel</p>
                    <p className="text-base text-gray-900">{agent.professionalPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* District Assignment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Affectation</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Quartier
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(parseInt(e.target.value))}
                >
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDistrict !== agent.districtId && (
                <Button
                  onClick={handleSaveDistrict}
                  isLoading={isSaving}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Performance Stats */}
          {performance && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Relevés Moyens/Jour"
                value={performance.avgReadingsPerDay.toFixed(1)}
                icon={TrendingUp}
                color="primary"
              />
              <StatCard
                title="Total Relevés"
                value={performance.totalReadings}
                icon={TrendingUp}
                color="accent"
              />
              <StatCard
                title="Jours Travaillés"
                value={performance.daysWorked}
                icon={TrendingUp}
                color="success"
              />
            </div>
          )}

          {/* Performance Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Performance sur {getPeriodLabel(timePeriod)}
              </h2>
            </div>

            {/* Time Period Selector */}
            <div className="mb-6 flex flex-wrap gap-2">
              {(['1week', '1month', '3months', '6months', '1year'] as TimePeriod[]).map(
                (period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      timePeriod === period
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getPeriodLabel(period)}
                  </button>
                )
              )}
            </div>

            {/* Chart */}
            {performance && performance.dailyReadings.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performance.dailyReadings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.date}</p>
                            <p className="text-sm text-primary-600">
                              Relevés: {data.count}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1E40AF"
                    strokeWidth={2}
                    dot={{ fill: '#1E40AF', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                Aucune donnée disponible pour cette période
              </div>
            )}

            {/* Performance Indicator */}
            {performance && performance.avgReadingsPerDay > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Objectif quotidien</p>
                    <p className="text-lg font-semibold text-gray-900">50 relevés/jour</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Performance actuelle</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">
                        {performance.avgReadingsPerDay.toFixed(1)} relevés/jour
                      </p>
                      <Badge
                        variant={
                          performance.avgReadingsPerDay >= 50
                            ? 'success'
                            : performance.avgReadingsPerDay >= 30
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {performance.avgReadingsPerDay >= 50
                          ? 'Excellent'
                          : performance.avgReadingsPerDay >= 30
                          ? 'Bon'
                          : 'À améliorer'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgentDetail;
