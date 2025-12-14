import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, User, MapPin, Gauge, Calendar, TrendingUp } from 'lucide-react';
import axios from '../../lib/axios';
import { Reading, MeterType } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDateTime, getMeterTypeLabel, getInitials } from '../../lib/utils';
import toast from 'react-hot-toast';

const ReadingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReading();
  }, [id]);

  const fetchReading = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/readings/${id}`);
      setReading(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du relevé');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMeterId = () => {
    if (reading?.meter?.meterId) {
      navigator.clipboard.writeText(reading.meter.meterId);
      toast.success('ID compteur copié!');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!reading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Relevé non trouvé</p>
        <Button onClick={() => navigate('/readings')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/readings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Détail du Relevé</h1>
          <p className="mt-1 text-sm text-gray-500">
            Relevé #{reading.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informations du Relevé</h2>

          <div className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Date et Heure</p>
                <p className="text-base text-gray-900">{formatDateTime(reading.readingDate)}</p>
              </div>
            </div>

            {/* Agent */}
            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Agent</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white text-xs font-semibold">
                    {reading.agent && getInitials(reading.agent.firstName, reading.agent.lastName)}
                  </div>
                  <p className="text-base text-gray-900">
                    {reading.agent?.lastName} {reading.agent?.firstName}
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Adresse Complète</p>
                <p className="text-base text-gray-900">
                  {reading.meter?.address?.number} {reading.meter?.address?.street}
                  {reading.meter?.address?.floor && `, Étage ${reading.meter?.address?.floor}`}
                  {reading.meter?.address?.apartmentNumber && `, Apt ${reading.meter?.address?.apartmentNumber}`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Quartier: {reading.meter?.address?.district?.name}
                </p>
              </div>
            </div>

            {/* Client */}
            {reading.meter?.address?.client && (
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="text-base text-gray-900">
                    {reading.meter.address.client.lastName} {reading.meter.address.client.firstName}
                  </p>
                  <p className="text-sm text-gray-500">
                    ID: {reading.meter.address.client.clientId}
                  </p>
                </div>
              </div>
            )}

            {/* Meter ID */}
            <div className="flex items-start">
              <Gauge className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">ID Compteur</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-base font-mono text-gray-900">{reading.meter?.meterId}</p>
                  <button
                    onClick={handleCopyMeterId}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Copier"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Meter Type */}
            <div className="flex items-start">
              <Gauge className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Type de Compteur</p>
                <div className="mt-1">
                  <Badge variant={reading.meter?.meterType === MeterType.WATER ? 'info' : 'warning'}>
                    {getMeterTypeLabel(reading.meter?.meterType || MeterType.WATER)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Consumption Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            Consommation
          </h2>

          <div className="space-y-4">
            {/* Previous Index */}
            <div>
              <p className="text-sm font-medium text-gray-500">Index Précédent</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {Number(reading.previousIndex).toFixed(2)}
              </p>
            </div>

            {/* Current Index */}
            <div>
              <p className="text-sm font-medium text-gray-500">Index Actuel</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {Number(reading.currentIndex).toFixed(2)}
              </p>
            </div>

            {/* Consumption (Highlighted) */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg p-4 border-2 border-primary-200">
              <p className="text-sm font-medium text-primary-700">Consommation Calculée</p>
              <p className="text-3xl font-bold text-primary-900 mt-2">
                {Number(reading.consumption).toFixed(2)}
              </p>
              <p className="text-sm text-primary-600 mt-1">
                {reading.meter?.meterType === MeterType.WATER ? 'm³' : 'kWh'}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Créé le: {reading.createdAt && formatDateTime(reading.createdAt)}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadingDetail;
