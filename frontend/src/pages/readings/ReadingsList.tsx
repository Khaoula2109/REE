import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, Calendar, Filter } from 'lucide-react';
import axios from '../../lib/axios';
import { Reading, MeterType } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { formatDateTime, getMeterTypeLabel } from '../../lib/utils';
import toast from 'react-hot-toast';

const ReadingsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [districts, setDistricts] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    page: searchParams.get('page') || '1',
    limit: '20',
    date: searchParams.get('date') || '',
    districtId: searchParams.get('districtId') || '',
    agentId: searchParams.get('agentId') || '',
    meterType: searchParams.get('meterType') || '',
    search: searchParams.get('search') || '',
  });

  useEffect(() => {
    fetchDistricts();
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchReadings();
    updateSearchParams();
  }, [filters]);

  const updateSearchParams = () => {
    const params: any = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    setSearchParams(params);
  };

  const fetchDistricts = async () => {
    try {
      const response = await axios.get('/dashboard/coverage-rate');
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts');
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/agents');
      setAgents(response.data);
    } catch (error) {
      console.error('Error fetching agents');
    }
  };

  const fetchReadings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/readings?${params.toString()}`);
      setReadings(response.data.readings || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des relevés');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: '1' }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage.toString() }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`/readings/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `releves-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export réussi!');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleRowClick = (id: number) => {
    navigate(`/readings/${id}`);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liste des Relevés</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination.total} relevés au total
          </p>
        </div>
        <Button onClick={handleExport} variant="secondary" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quartier</label>
            <select
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={filters.districtId}
              onChange={(e) => handleFilterChange('districtId', e.target.value)}
            >
              <option value="">Tous les quartiers</option>
              {districts.map((d) => (
                <option key={d.districtId} value={d.districtId}>
                  {d.districtName}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={filters.agentId}
              onChange={(e) => handleFilterChange('agentId', e.target.value)}
            >
              <option value="">Tous les agents</option>
              {agents.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.lastName} {a.firstName}
                </option>
              ))}
            </select>
          </div>

          {/* Meter Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={filters.meterType}
              onChange={(e) => handleFilterChange('meterType', e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="WATER">Eau</option>
              <option value="ELECTRICITY">Électricité</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Client..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.date || filters.districtId || filters.agentId || filters.meterType || filters.search) && (
          <div className="mt-3">
            <button
              onClick={() => setFilters({ page: '1', limit: '20', date: '', districtId: '', agentId: '', meterType: '', search: '' })}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              <Filter className="inline h-4 w-4 mr-1" />
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {readings.length > 0 ? (
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consommation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.map((reading) => (
                  <motion.tr
                    key={reading.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick(reading.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(reading.readingDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reading.agent?.lastName} {reading.agent?.firstName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={reading.meter?.address?.street}>
                        {reading.meter?.address?.number} {reading.meter?.address?.street}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={reading.meter?.meterType === MeterType.WATER ? 'info' : 'warning'}>
                        {getMeterTypeLabel(reading.meter?.meterType || MeterType.WATER)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {Number(reading.consumption).toFixed(2)}{' '}
                      {reading.meter?.meterType === MeterType.WATER ? 'm³' : 'kWh'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {pagination.page} sur {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="Aucun relevé trouvé"
          description="Aucun relevé ne correspond à vos critères de recherche"
        />
      )}
    </div>
  );
};

export default ReadingsList;
