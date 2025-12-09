const Reports = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Rapports et Statistiques</h1>
      <div className="mt-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Rapport Mensuel des Relevés</h3>
          <p className="text-gray-500 mb-4">Distribution des agents par quartier et moyenne par jour</p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md">
            Générer PDF
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Rapport d'Évolution de la Consommation</h3>
          <p className="text-gray-500 mb-4">Tendances de consommation eau/électricité</p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-md">
            Générer PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
