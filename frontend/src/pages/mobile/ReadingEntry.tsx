import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Gauge, CheckCircle, AlertCircle, Droplet, Zap } from 'lucide-react';
import axios from '../../lib/axios';
import toast from 'react-hot-toast';

const readingSchema = z.object({
  currentIndex: z.string().min(1, 'Index requis'),
});

type ReadingFormData = z.infer<typeof readingSchema>;

const ReadingEntry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const address = location.state?.address;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReadingFormData>({
    resolver: zodResolver(readingSchema),
  });

  const currentIndexValue = watch('currentIndex');
  const previousIndex = address?.currentIndex || 0;
  const newIndex = parseFloat(currentIndexValue) || 0;
  const consumption = newIndex > previousIndex ? newIndex - previousIndex : 0;

  const onSubmit = async (data: ReadingFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        meterId: address.meterId,
        currentIndex: parseFloat(data.currentIndex),
        readingDate: new Date().toISOString(),
      };

      await axios.post('/mobile/readings', payload);

      setShowSuccess(true);
      toast.success('Relevé enregistré avec succès!');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/mobile/addresses');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'enregistrement';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!address) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
          <p className="text-red-900 font-medium">Aucune adresse sélectionnée</p>
          <button
            onClick={() => navigate('/mobile/addresses')}
            className="mt-4 text-red-600 underline"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center"
        >
          <div className="bg-green-100 p-6 rounded-full inline-block mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Relevé enregistré!</h2>
          <p className="text-gray-600">Redirection en cours...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Nouveau relevé</h1>
      </div>

      {/* Address Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-md"
      >
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
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
          </div>
        </div>

        <div className="flex items-center gap-2">
          {address.meterType === 'WATER' ? (
            <Droplet className="h-5 w-5 text-blue-600" />
          ) : (
            <Zap className="h-5 w-5 text-yellow-600" />
          )}
          <span className="font-medium text-gray-700">
            {address.meterType === 'WATER' ? 'Compteur d\'eau' : 'Compteur d\'électricité'}
          </span>
        </div>
        <p className="text-sm text-gray-500 font-mono mt-1">#{address.meterNumber}</p>
      </motion.div>

      {/* Reading Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Previous Index */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 rounded-xl p-4"
        >
          <label className="text-sm font-medium text-gray-700">Index précédent</label>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {previousIndex.toFixed(2)}
            <span className="text-lg text-gray-500 ml-2">
              {address.meterType === 'WATER' ? 'm³' : 'kWh'}
            </span>
          </p>
        </motion.div>

        {/* Current Index Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-md"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nouvel index *
          </label>
          <div className="relative">
            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              {...register('currentIndex')}
              type="number"
              step="0.01"
              min={previousIndex}
              placeholder={`Min: ${previousIndex.toFixed(2)}`}
              className="block w-full pl-12 pr-16 py-4 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              {address.meterType === 'WATER' ? 'm³' : 'kWh'}
            </span>
          </div>
          {errors.currentIndex && (
            <p className="mt-2 text-sm text-red-600">{errors.currentIndex.message}</p>
          )}
          {newIndex > 0 && newIndex < previousIndex && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              L'index ne peut pas être inférieur à l'index précédent
            </p>
          )}
        </motion.div>

        {/* Consumption Preview */}
        {consumption > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary-50 rounded-xl p-4 border-2 border-primary-200"
          >
            <p className="text-sm font-medium text-primary-900 mb-1">Consommation calculée</p>
            <p className="text-4xl font-bold text-primary-600">
              {consumption.toFixed(2)}
              <span className="text-xl text-primary-500 ml-2">
                {address.meterType === 'WATER' ? 'm³' : 'kWh'}
              </span>
            </p>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || newIndex <= previousIndex}
          className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le relevé'}
        </button>
      </form>

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center px-4">
        Assurez-vous que l'index saisi correspond bien à la valeur affichée sur le compteur
      </p>
    </div>
  );
};

export default ReadingEntry;
