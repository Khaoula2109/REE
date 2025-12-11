import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import axios from '../lib/axios';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const Reports = () => {
  const [monthlyReadingsStartDate, setMonthlyReadingsStartDate] = useState('');
  const [monthlyReadingsEndDate, setMonthlyReadingsEndDate] = useState('');
  const [consumptionStartDate, setConsumptionStartDate] = useState('');
  const [consumptionEndDate, setConsumptionEndDate] = useState('');
  const [isGeneratingMonthlyReadings, setIsGeneratingMonthlyReadings] = useState(false);
  const [isGeneratingConsumption, setIsGeneratingConsumption] = useState(false);

  const handleGenerateMonthlyReadingsReport = async () => {
    if (!monthlyReadingsStartDate || !monthlyReadingsEndDate) {
      toast.error('Veuillez sélectionner une plage de dates');
      return;
    }

    try {
      setIsGeneratingMonthlyReadings(true);
      const params = new URLSearchParams({
        startDate: monthlyReadingsStartDate,
        endDate: monthlyReadingsEndDate,
      });

      const response = await axios.get(`/reports/monthly-readings?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `rapport_releves_mensuels_${monthlyReadingsStartDate}_${monthlyReadingsEndDate}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Rapport généré avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la génération du rapport');
    } finally {
      setIsGeneratingMonthlyReadings(false);
    }
  };

  const handleGenerateConsumptionReport = async () => {
    if (!consumptionStartDate || !consumptionEndDate) {
      toast.error('Veuillez sélectionner une plage de dates');
      return;
    }

    try {
      setIsGeneratingConsumption(true);
      const params = new URLSearchParams({
        startDate: consumptionStartDate,
        endDate: consumptionEndDate,
      });

      const response = await axios.get(`/reports/consumption-evolution?${params.toString()}`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `rapport_consommation_${consumptionStartDate}_${consumptionEndDate}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Rapport généré avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la génération du rapport');
    } finally {
      setIsGeneratingConsumption(false);
    }
  };

  // Set default dates to last month
  const getLastMonthDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  const defaultDates = getLastMonthDates();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports et Statistiques</h1>
        <p className="mt-1 text-sm text-gray-500">
          Générer des rapports PDF détaillés sur les relevés et la consommation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Readings Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-white mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Rapport Mensuel des Relevés
                </h2>
                <p className="text-sm text-primary-100 mt-1">
                  Distribution par agent et quartier
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Contenu du rapport
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Nombre de relevés effectués par agent</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Distribution des agents par quartier</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Moyenne de relevés par jour et par agent</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span>Statistiques globales de performance</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="inline h-4 w-4 mr-1" />
                Période de rapport
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    value={monthlyReadingsStartDate || defaultDates.start}
                    onChange={(e) => setMonthlyReadingsStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    value={monthlyReadingsEndDate || defaultDates.end}
                    onChange={(e) => setMonthlyReadingsEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateMonthlyReadingsReport}
              isLoading={isGeneratingMonthlyReadings}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Générer le Rapport PDF
            </Button>
          </div>
        </motion.div>

        {/* Consumption Evolution Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-white mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Rapport d'Évolution de la Consommation
                </h2>
                <p className="text-sm text-accent-100 mt-1">
                  Tendances eau et électricité
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Contenu du rapport
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-accent-600 mr-2">•</span>
                  <span>Évolution mensuelle de la consommation moyenne</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent-600 mr-2">•</span>
                  <span>Comparaison eau vs électricité</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent-600 mr-2">•</span>
                  <span>Tendances et variations par période</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent-600 mr-2">•</span>
                  <span>Totaux et moyennes par type de compteur</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="inline h-4 w-4 mr-1" />
                Période de rapport
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                    value={consumptionStartDate || defaultDates.start}
                    onChange={(e) => setConsumptionStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500"
                    value={consumptionEndDate || defaultDates.end}
                    onChange={(e) => setConsumptionEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateConsumptionReport}
              isLoading={isGeneratingConsumption}
              className="w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700"
            >
              <Download className="h-4 w-4" />
              Générer le Rapport PDF
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">À propos des rapports</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Les rapports sont générés en format PDF et incluent des graphiques et
                tableaux détaillés. Les données sont extraites en temps réel de la base
                de données pour la période sélectionnée.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
