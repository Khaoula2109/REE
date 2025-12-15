import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Droplet, Zap, Phone, User, ChevronRight, RefreshCw } from 'lucide-react';
import axios from '../../lib/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

interface Address {
  meterId: number;
  meterNumber: string;
  meterType: 'WATER' | 'ELECTRICITY';
  currentIndex: number;
  address: {
    id: number;
    street: string;
    number: string;
    floor?: string;
    apartmentNumber?: string;
    district: string;
  };
  client: {
    id: number;
    clientId: string;
    name: string;
    phone?: string;
  };
}

interface AddressesResponse {
  total: number;
  addresses: Address[];
  period: {
    start: string;
    end: string;
  };
}

const AddressesList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AddressesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<AddressesResponse>('/mobile/addresses');
      setData(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des adresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressClick = (address: Address) => {
    navigate('/mobile/reading', { state: { address } });
  };

  if (isLoading) return <LoadingSpinner />;

  if (!data || data.addresses.length === 0) {
    return (
      <EmptyState
        title="Aucune adresse à visiter"
        description="Tous les compteurs de votre quartier ont été relevés ce mois-ci. Excellent travail!"
        icon={MapPin}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ma tournée</h2>
            <p className="text-sm text-gray-600 mt-1">
              {data.total} compteur{data.total > 1 ? 's' : ''} à relever
            </p>
          </div>
          <button
            onClick={fetchAddresses}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Actualiser"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Addresses List */}
      <div className="space-y-3">
        {data.addresses.map((address, index) => (
          <motion.div
            key={address.meterId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleAddressClick(address)}
            className="bg-white rounded-xl p-4 shadow-md active:scale-98 transition-transform cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Address */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {address.address.number} {address.address.street}
                    </p>
                    {(address.address.floor || address.address.apartmentNumber) && (
                      <p className="text-sm text-gray-600">
                        {address.address.floor && `Étage ${address.address.floor}`}
                        {address.address.floor && address.address.apartmentNumber && ', '}
                        {address.address.apartmentNumber && `Apt ${address.address.apartmentNumber}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {address.address.district}
                    </p>
                  </div>
                </div>

                {/* Meter Info */}
                <div className="flex items-center gap-2 mb-3">
                  {address.meterType === 'WATER' ? (
                    <Droplet className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Zap className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {address.meterType === 'WATER' ? 'Eau' : 'Électricité'}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    #{address.meterNumber}
                  </span>
                </div>

                {/* Client Info */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{address.client.name}</span>
                  </div>
                  {address.client.phone && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{address.client.phone}</span>
                    </div>
                  )}
                </div>

                {/* Current Index */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Index actuel</p>
                  <p className="text-lg font-bold text-primary-900">
                    {address.currentIndex.toFixed(2)}
                    <span className="text-sm text-gray-500 ml-1">
                      {address.meterType === 'WATER' ? 'm³' : 'kWh'}
                    </span>
                  </p>
                </div>
              </div>

              <ChevronRight className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AddressesList;
