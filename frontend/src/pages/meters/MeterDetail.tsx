import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Gauge,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  ExternalLink,
  Droplet,
  Zap,
} from 'lucide-react';
import axios from '../../lib/axios';
import { Meter, Reading, MeterType } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDateTime, getMeterTypeLabel, getInitials } from '../../lib/utils';
import toast from 'react-hot-toast';

const MeterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meter, setMeter] = useState<Meter | null>(null);
  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMeterDetails();
  }, [id]);

  const fetchMeterDetails = async () => {
    try {
      setIsLoading(true);
      const [meterRes, readingsRes] = await Promise.all([
        axios.get<Meter>(`/meters/${id}`),
        axios.get<Reading[]>(`/readings/meter/${id}`),
      ]);
      setMeter(meterRes.data);
      setRecentReadings(readingsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du compteur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllReadings = () => {
    navigate(`/readings?meterId=${id}`);
  };

  const getMeterTypeIcon = (type: MeterType) => {
    return type === MeterType.WATER ? (
      <Droplet className="h-5 w-5" />
    ) : (
      <Zap className="h-5 w-5" />
    );
  };

  if (isLoading) return <LoadingSpinner />;

  if (!meter) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Compteur non trouvé</p>
        <Button onClick={() => navigate('/meters')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/meters')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Détail du Compteur</h1>
          <p className="mt-1 text-sm text-gray-500">Compteur #{meter.meterId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Meter Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Meter Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Informations du Compteur
            </h2>

            <div className="space-y-4">
              {/* Meter ID */}
              <div className="flex items-start">
                <Gauge className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">ID Compteur</p>
                  <p className="text-base font-mono font-semibold text-gray-900">
                    {meter.meterId}
                  </p>
                </div>
              </div>

              {/* Meter Type */}
              <div className="flex items-start">
                {getMeterTypeIcon(meter.meterType)}
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <div className="mt-1">
                    <Badge
                      variant={meter.meterType === MeterType.WATER ? 'info' : 'warning'}
                    >
                      {getMeterTypeLabel(meter.meterType)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Current Index */}
              <div className="flex items-start">
                <TrendingUp className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Index Actuel</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">
                    {meter.currentIndex.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {meter.meterType === MeterType.WATER ? 'm³' : 'kWh'}
                  </p>
                </div>
              </div>

              {/* Last Reading Date */}
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Dernier Relevé</p>
                  <p className="text-base text-gray-900">
                    {meter.lastReadingDate
                      ? formatDateTime(meter.lastReadingDate)
                      : 'Aucun relevé'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Adresse</h2>

            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-base text-gray-900">
                    {meter.address?.number} {meter.address?.street}
                  </p>
                  {(meter.address?.floor || meter.address?.apartmentNumber) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {meter.address?.floor && `Étage ${meter.address.floor}`}
                      {meter.address?.floor && meter.address?.apartmentNumber && ', '}
                      {meter.address?.apartmentNumber &&
                        `Apt ${meter.address.apartmentNumber}`}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Quartier: {meter.address?.district?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Type: {meter.address?.addressType}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              {meter.address?.client && (
                <div className="flex items-start pt-4 border-t">
                  <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client</p>
                    <p className="text-base text-gray-900">
                      {meter.address.client.lastName} {meter.address.client.firstName}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {meter.address.client.clientId}
                    </p>
                    {meter.address.client.phone && (
                      <p className="text-sm text-gray-500">
                        Tél: {meter.address.client.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Reading History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Historique des Relevés</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Les 10 derniers relevés effectués
                </p>
              </div>
              {recentReadings.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleViewAllReadings}
                  className="flex items-center gap-2"
                >
                  Voir tous les relevés
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              {recentReadings.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Index Préc.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Index Actuel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consommation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentReadings.map((reading) => (
                      <motion.tr
                        key={reading.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => navigate(`/readings/${reading.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateTime(reading.readingDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-xs font-semibold">
                              {reading.agent &&
                                getInitials(
                                  reading.agent.firstName,
                                  reading.agent.lastName
                                )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm text-gray-900">
                                {reading.agent?.lastName} {reading.agent?.firstName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reading.previousIndex.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reading.currentIndex.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-primary-600">
                            {reading.consumption.toFixed(2)}{' '}
                            {meter.meterType === MeterType.WATER ? 'm³' : 'kWh'}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Aucun relevé
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Aucun relevé n'a encore été effectué pour ce compteur.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MeterDetail;
