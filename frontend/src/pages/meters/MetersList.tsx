import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Gauge, ChevronLeft, ChevronRight, Droplet, Zap } from 'lucide-react';
import axios from '../../lib/axios';
import { Meter, District, MeterType, PaginatedResponse } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getMeterTypeLabel } from '../../lib/utils';
import toast from 'react-hot-toast';

const MetersList = () => {
  const navigate = useNavigate();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [meterTypeFilter, setMeterTypeFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    fetchMeters();
  }, [pagination.page, districtFilter, meterTypeFilter, searchTerm]);

  const fetchDistricts = async () => {
    try {
      const response = await axios.get<District[]>('/districts');
      setDistricts(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des quartiers');
    }
  };

  const fetchMeters = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (districtFilter !== 'all') {
        params.append('districtId', districtFilter);
      }

      if (meterTypeFilter !== 'all') {
        params.append('meterType', meterTypeFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await axios.get<PaginatedResponse<Meter>>(
        `/meters?${params.toString()}`
      );

      setMeters(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Erreur lors du chargement des compteurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (meterId: number) => {
    navigate(`/meters/${meterId}`);
  };

  const handleAddMeter = () => {
    navigate('/meters/add');
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const getMeterTypeIcon = (type: MeterType) => {
    return type === MeterType.WATER ? (
      <Droplet className="h-4 w-4" />
    ) : (
      <Zap className="h-4 w-4" />
    );
  };

  if (isLoading && pagination.page === 1) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Compteurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Liste des compteurs d'eau et d'électricité
          </p>
        </div>
        <Button onClick={handleAddMeter} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Compteur
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Rechercher par ID ou adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="all">Tous les quartiers</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id.toString()}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={meterTypeFilter}
            onChange={(e) => setMeterTypeFilter(e.target.value)}
          >
            <option value="all">Tous les types</option>
            <option value={MeterType.WATER}>Eau</option>
            <option value={MeterType.ELECTRICITY}>Électricité</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          {pagination.total} compteur{pagination.total > 1 ? 's' : ''} trouvé
          {pagination.total > 1 ? 's' : ''}
        </div>
        {pagination.totalPages > 1 && (
          <div>
            Page {pagination.page} sur {pagination.totalPages}
          </div>
        )}
      </div>

      {/* Meters Table */}
      {meters.length > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Compteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quartier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index Actuel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernier Relevé
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {meters.map((meter) => (
                  <motion.tr
                    key={meter.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleRowClick(meter.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Gauge className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {meter.meterId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={meter.meterType === MeterType.WATER ? 'info' : 'warning'}
                      >
                        <span className="flex items-center gap-1">
                          {getMeterTypeIcon(meter.meterType)}
                          {getMeterTypeLabel(meter.meterType)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {meter.address?.number} {meter.address?.street}
                      </div>
                      {(meter.address?.floor || meter.address?.apartmentNumber) && (
                        <div className="text-sm text-gray-500">
                          {meter.address?.floor && `Étage ${meter.address.floor}`}
                          {meter.address?.floor && meter.address?.apartmentNumber && ', '}
                          {meter.address?.apartmentNumber &&
                            `Apt ${meter.address.apartmentNumber}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {meter.address?.district?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {meter.currentIndex.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {meter.lastReadingDate
                          ? new Date(meter.lastReadingDate).toLocaleDateString('fr-FR')
                          : 'Jamais'}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                onClick={handlePreviousPage}
                disabled={pagination.page === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <div className="text-sm text-gray-700">
                Page {pagination.page} sur {pagination.totalPages}
              </div>
              <Button
                variant="secondary"
                onClick={handleNextPage}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="Aucun compteur trouvé"
          description="Commencez par ajouter un nouveau compteur"
          icon={Gauge}
          action={
            <Button onClick={handleAddMeter}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Compteur
            </Button>
          }
        />
      )}
    </div>
  );
};

export default MetersList;
