import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Droplet, Zap, MapPin, Search, CheckCircle } from 'lucide-react';
import axios from '../../lib/axios';
import { MeterType, Address, District } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

const AddMeter = () => {
  const navigate = useNavigate();
  const [meterType, setMeterType] = useState<MeterType>(MeterType.WATER);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [availableAddresses, setAvailableAddresses] = useState<Address[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailableAddresses();
    }
  }, [isModalOpen, meterType]);

  useEffect(() => {
    filterAddresses();
  }, [availableAddresses, districtFilter, searchTerm]);

  const fetchDistricts = async () => {
    try {
      const response = await axios.get<District[]>('/districts');
      setDistricts(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des quartiers');
    }
  };

  const fetchAvailableAddresses = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        meterType,
      });

      const response = await axios.get<Address[]>(
        `/meters/available-addresses?${params.toString()}`
      );
      setAvailableAddresses(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des adresses');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAddresses = () => {
    let filtered = availableAddresses;

    if (districtFilter !== 'all') {
      filtered = filtered.filter(
        (address) => address.districtId === parseInt(districtFilter)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (address) =>
          address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
          address.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          address.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          address.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAddresses(filtered);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setDistrictFilter('all');
    setSearchTerm('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDistrictFilter('all');
    setSearchTerm('');
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    handleCloseModal();
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      toast.error('Veuillez sélectionner une adresse');
      return;
    }

    try {
      setIsSaving(true);
      const response = await axios.post('/meters', {
        meterType,
        addressId: selectedAddress.id,
      });

      toast.success('Compteur créé avec succès');
      navigate(`/meters/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du compteur');
    } finally {
      setIsSaving(false);
    }
  };

  const getMeterTypeIcon = (type: MeterType, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
    return type === MeterType.WATER ? (
      <Droplet className={sizeClass} />
    ) : (
      <Zap className={sizeClass} />
    );
  };

  const getMeterTypeColor = (type: MeterType) => {
    return type === MeterType.WATER ? 'text-blue-600' : 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/meters')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un Compteur</h1>
          <p className="mt-1 text-sm text-gray-500">
            Créer un nouveau compteur d'eau ou d'électricité
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          {/* Step 1: Select Meter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de Compteur *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMeterType(MeterType.WATER)}
                className={`relative flex items-center justify-center gap-3 p-6 border-2 rounded-lg transition-all ${
                  meterType === MeterType.WATER
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className={getMeterTypeColor(MeterType.WATER)}>
                  {getMeterTypeIcon(MeterType.WATER, 'lg')}
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold text-gray-900">Eau</p>
                  <p className="text-sm text-gray-500">Compteur d'eau</p>
                </div>
                {meterType === MeterType.WATER && (
                  <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-blue-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMeterType(MeterType.ELECTRICITY);
                  setSelectedAddress(null); // Reset address when changing type
                }}
                className={`relative flex items-center justify-center gap-3 p-6 border-2 rounded-lg transition-all ${
                  meterType === MeterType.ELECTRICITY
                    ? 'border-yellow-600 bg-yellow-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className={getMeterTypeColor(MeterType.ELECTRICITY)}>
                  {getMeterTypeIcon(MeterType.ELECTRICITY, 'lg')}
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold text-gray-900">Électricité</p>
                  <p className="text-sm text-gray-500">Compteur électrique</p>
                </div>
                {meterType === MeterType.ELECTRICITY && (
                  <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-yellow-600" />
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Select Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Adresse *
            </label>
            {selectedAddress ? (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-base font-medium text-gray-900">
                        {selectedAddress.number} {selectedAddress.street}
                      </p>
                      {(selectedAddress.floor || selectedAddress.apartmentNumber) && (
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedAddress.floor && `Étage ${selectedAddress.floor}`}
                          {selectedAddress.floor && selectedAddress.apartmentNumber && ', '}
                          {selectedAddress.apartmentNumber &&
                            `Apt ${selectedAddress.apartmentNumber}`}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Quartier: {selectedAddress.district?.name}
                      </p>
                      {selectedAddress.client && (
                        <p className="text-sm text-gray-500">
                          Client: {selectedAddress.client.lastName}{' '}
                          {selectedAddress.client.firstName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenModal}
                    className="ml-4"
                  >
                    Changer
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={handleOpenModal}
                className="w-full flex items-center justify-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Sélectionner une adresse
              </Button>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Seules les adresses sans compteur de type{' '}
              {meterType === MeterType.WATER ? 'eau' : 'électricité'} sont disponibles.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/meters')}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isSaving}
              disabled={!selectedAddress}
              className="flex-1"
            >
              Créer le Compteur
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Address Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Sélectionner une adresse"
        size="lg"
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Rechercher une adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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

          {/* Address List */}
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : filteredAddresses.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredAddresses.map((address) => (
                <motion.button
                  key={address.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  type="button"
                  onClick={() => handleSelectAddress(address)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-base font-medium text-gray-900">
                        {address.number} {address.street}
                      </p>
                      {(address.floor || address.apartmentNumber) && (
                        <p className="text-sm text-gray-500 mt-1">
                          {address.floor && `Étage ${address.floor}`}
                          {address.floor && address.apartmentNumber && ', '}
                          {address.apartmentNumber && `Apt ${address.apartmentNumber}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info" size="sm">
                          {address.district?.name}
                        </Badge>
                        {address.client && (
                          <span className="text-xs text-gray-500">
                            Client: {address.client.lastName} {address.client.firstName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucune adresse disponible
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucune adresse ne correspond à vos critères ou toutes les adresses ont déjà
                un compteur de type {meterType === MeterType.WATER ? 'eau' : 'électricité'}.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AddMeter;
