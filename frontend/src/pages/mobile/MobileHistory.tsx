import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Droplet, Zap, TrendingUp, RefreshCw } from 'lucide-react';
import axios from '../../lib/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Reading {
  id: number;
  meterNumber: string;
  meterType: 'WATER' | 'ELECTRICITY';
  address: string;
  previousIndex: number;
  currentIndex: number;
  consumption: number;
  readingDate: string;
}

interface HistoryResponse {
  total: number;
  readings: Reading[];
}

const MobileHistory = () => {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<HistoryResponse>('/mobile/history?limit=50');
      setData(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (!data || data.readings.length === 0) {
    return (
      <EmptyState
        title="Aucun relevé"
        description="Votre historique de relevés apparaîtra ici"
        icon={Calendar}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Historique</h2>
            <p className="text-sm text-gray-600 mt-1">
              {data.total} relevé{data.total > 1 ? 's' : ''} effectué{data.total > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Actualiser"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Readings List */}
      <div className="space-y-3">
        {data.readings.map((reading, index) => (
          <motion.div
            key={reading.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white rounded-xl p-4 shadow-md"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {reading.meterType === 'WATER' ? (
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Droplet className="h-5 w-5 text-blue-600" />
                  </div>
                ) : (
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {reading.meterType === 'WATER' ? 'Eau' : 'Électricité'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    #{reading.meterNumber}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(reading.readingDate)}
              </span>
            </div>

            {/* Address */}
            <p className="text-sm text-gray-700 mb-3">📍 {reading.address}</p>

            {/* Reading Details */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500">Index préc.</p>
                <p className="text-sm font-semibold text-gray-900">
                  {reading.previousIndex.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Index actuel</p>
                <p className="text-sm font-semibold text-gray-900">
                  {reading.currentIndex.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Consommation</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary-600" />
                  <p className="text-sm font-bold text-primary-600">
                    {reading.consumption.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More (if needed) */}
      {data.total > data.readings.length && (
        <button
          onClick={fetchHistory}
          className="w-full py-3 text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition"
        >
          Charger plus
        </button>
      )}
    </div>
  );
};

export default MobileHistory;
