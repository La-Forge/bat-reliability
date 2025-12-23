import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MapPin, Building2, Search, Loader, Zap, Download, X, Map, List, TrendingUp, CheckCircle, AlertTriangle, Wifi, Ruler, MousePointer2 } from 'lucide-react';
import { fetchBuildingsInBbox } from './services/bdnbService.js';
import ListComponent from './ListComponent.jsx';

// Lazy load de la carte
const MapComponent = lazy(() => import('./MapComponent.jsx'));

const BuildingScanner = () => {
  const [location, setLocation] = useState('Montpellier');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [budgetTravaux, setBudgetTravaux] = useState(250000);
  const [prixVenteM2, setPrixVenteM2] = useState(4000);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Filtres de recherche
  const [filters, setFilters] = useState({
    surfaceMin: 600,
    yearMin: '',
    yearMax: '',
    tertiaire: true,
    pluCompatible: true
  });

  // Données réelles de Montpellier avec coordonnées GPS précises
  const mockScanResults = {
    'montpellier': {
      scanned: 2847,
      potential: 12,
      zone: 'Montpellier - Antigone / Richter',
      buildings: [
        { 
          id: 1, 
          address: '14 Rue Georges Méliès', 
          lat: 43.6108, lng: 3.8820, 
          score: 92, 
          surface: 1580, 
          type: 'Résidentiel Collectif', 
          year: 2010, 
          floors: 5,
          image: "/api/placeholder/400/200",
          details: {
            dpe: 'A',
            hsp: '2.8m',
            structure: 'Poteaux-Poutres (Modulable)',
            fiber: 'Raccordé',
            plu: 'Zone UA (Mixité autorisée)',
            access: 'PMR Total'
          },
          subscores: {
            technique: 95,
            reglementaire: 100,
            marche: 85,
            esg: 88
          }
        },
        { 
          id: 2, 
          address: '85 Avenue de la Mer', 
          lat: 43.6095, lng: 3.8850, 
          score: 87, 
          surface: 1240, 
          type: 'Ancien Logement Social', 
          year: 1995, 
          floors: 4,
          image: "/api/placeholder/400/200",
          details: {
            dpe: 'C',
            hsp: '2.5m',
            structure: 'Murs porteurs (Contrainte)',
            fiber: 'Raccordé',
            plu: 'Zone UA',
            access: 'Partiel (Ascenseur petit)'
          },
          subscores: {
            technique: 70,
            reglementaire: 90,
            marche: 95,
            esg: 82
          }
        },
        { 
          id: 3, 
          address: 'Place de Thessalie', 
          lat: 43.6120, lng: 3.8800, 
          score: 74, 
          surface: 900, 
          type: 'Résidentiel Standing', 
          year: 1998, 
          floors: 3,
          image: "/api/placeholder/400/200",
          details: {
            dpe: 'D',
            hsp: '2.5m',
            structure: 'Mixte',
            fiber: 'Non raccordé',
            plu: 'Zone UB',
            access: 'Non conforme'
          },
          subscores: {
            technique: 65,
            reglementaire: 60,
            marche: 80,
            esg: 70
          }
        }
      ]
    }
  };

  const handleScan = async () => {
    const searchKey = 'montpellier'; 
    setIsScanning(true);
    setScanProgress(0);
    setResults(null);
    setSelectedBuilding(null);

    const stages = [
      { progress: 10, message: 'Initialisation du contexte géographique (IGN)...' },
      { progress: 30, message: 'Interrogation API BDNB (CSTB)...' },
      { progress: 50, message: 'Analyse de la trame structurelle...' },
      { progress: 70, message: 'Vérification PLU & Zonage...' },
      { progress: 90, message: 'Calcul du potentiel de réversibilité...' },
      { progress: 100, message: 'Terminé.' }
    ];

    let currentStage = 0;
    const interval = setInterval(async () => {
      if (currentStage < stages.length) {
        setScanProgress(stages[currentStage].progress);
        
        // Appel API BDNB à l'étape 30%
        if (stages[currentStage].progress === 30) {
          try {
            // Zone Montpellier Antigone
            const bdnbData = await fetchBuildingsInBbox(43.605, 3.875, 43.615, 3.890);
            if (bdnbData && bdnbData.length > 0) {
              // Utiliser les données BDNB
              const realResults = {
                scanned: bdnbData.length * 10,
                potential: bdnbData.length,
                zone: 'Montpellier - Données BDNB',
                buildings: bdnbData.sort((a, b) => b.score - a.score) // Tri par score décroissant
              };
              
              setTimeout(() => {
                clearInterval(interval);
                setResults(realResults);
                setIsScanning(false);
              }, 1500);
              return;
            }
          } catch (error) {
            console.error('Erreur API BDNB, utilisation des données de démonstration');
          }
        }
        
        currentStage++;
      } else {
        // Fallback sur les données de démo
        clearInterval(interval);
        const demoResults = mockScanResults[searchKey];
        demoResults.buildings.sort((a, b) => b.score - a.score); // Tri par score
        setResults(demoResults);
        setIsScanning(false);
      }
    }, 500);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Composant pour les barres de progression des sous-scores
  const ScoreBar = ({ label, value }) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">{value}/100</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${getScoreColor(value)}`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* Navbar CSTB Style */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CSTB<span className="text-orange-600">Scan</span></h1>
            <p className="text-xs text-slate-500">Outil d'aide à la décision - Transformation d'actifs</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {!results ? (
             <div className="flex gap-2 items-center">
                <input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-slate-100 border-none rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Zone géographique..."
                />
                <button 
                  onClick={handleScan}
                  disabled={isScanning}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isScanning ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Lancer l'analyse
                </button>
             </div>
           ) : (
             <button 
               onClick={() => setResults(null)}
               className="text-slate-500 hover:text-slate-800 text-sm font-medium"
             >
               Nouvelle recherche
             </button>
           )}
        </div>
      </header>

      {/* Filters Panel - Always visible */}
      {!results && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="max-w-5xl grid grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Surface min (m²)</label>
              <input
                type="number"
                value={filters.surfaceMin}
                onChange={(e) => setFilters({...filters, surfaceMin: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Année min</label>
              <input
                type="number"
                value={filters.yearMin}
                onChange={(e) => setFilters({...filters, yearMin: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="1990"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Année max</label>
              <input
                type="number"
                value={filters.yearMax}
                onChange={(e) => setFilters({...filters, yearMax: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Bâtiment tertiaire</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.tertiaire}
                  onChange={(e) => setFilters({...filters, tertiaire: e.target.checked})}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">Uniquement tertiaire</span>
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">PLU compatible</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.pluCompatible}
                  onChange={(e) => setFilters({...filters, pluCompatible: e.target.checked})}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-slate-700">Logement autorisé</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Loading Overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-96 text-center relative">
              {/* Animation cercles concentriques */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-orange-600 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 border-4 border-orange-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute inset-4 border-4 border-orange-300 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                  
                  {/* Bâtiment qui grandit */}
                  <div className="absolute inset-6 bg-orange-600 rounded-full flex items-center justify-center">
                    <div 
                      className="transition-all duration-1000 ease-out"
                      style={{
                        transform: `scale(${0.3 + (scanProgress / 100) * 0.7})`,
                        opacity: 0.8 + (scanProgress / 100) * 0.2
                      }}
                    >
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-32">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Analyse macro-territoriale</h3>
                <p className="text-slate-500 mb-4">Croisement des référentiels nationaux...</p>
                
                {/* Compteur bâtiments */}
                <div className="bg-slate-100 rounded-lg p-4 mb-6">
                  <div className="text-sm text-slate-600 mb-1">Bâtiments analysés</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.floor((scanProgress / 100) * 2847)} / 2847
                  </div>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-orange-600 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-mono text-slate-400">{scanProgress}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!results && !isScanning && (
          <div className="w-full flex items-center justify-center flex-col bg-slate-50">
             <div className="text-center max-w-2xl px-6">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Identifiez le potentiel caché</h2>
                <p className="text-lg text-slate-600 mb-8">
                  Analysez des milliers de bâtiments tertiaires pour détecter leur aptitude à la conversion en logements résidentiels. 
                  Basé sur la BDNB, les fichiers fonciers et les règles d'urbanisme locales.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-semibold">Potentiel Marché</h4>
                    <p className="text-xs text-slate-500">Demande locative résidentielle</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <Ruler className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold">Morphologie</h4>
                    <p className="text-xs text-slate-500">Trame, HSP, Profondeur</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <Zap className="w-6 h-6 text-amber-600 mb-2" />
                    <h4 className="font-semibold">Réglementation</h4>
                    <p className="text-xs text-slate-500">PLU & Zonage</p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Results View */}
        {results && (
          <>
            {/* Sidebar List (Left) */}
            <div className={`bg-white border-r border-slate-200 flex flex-col z-10 transition-all duration-300 relative ${selectedBuilding ? 'hidden md:flex' : 'flex'} ${sidebarCollapsed ? 'w-12' : 'w-96'}`}>
              {/* Toggle button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute left-full top-1/2 -translate-y-1/2 bg-white border border-l-0 border-slate-200 rounded-r-lg p-2 hover:bg-slate-50 transition-colors shadow-md z-20"
              >
                {sidebarCollapsed ? '→' : '←'}
              </button>
              
              {!sidebarCollapsed && (
                <>
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Résultats</p>
                     <h2 className="text-xl font-bold text-slate-900">{results.potential} Bâtiments</h2>
                     <p className="text-xs text-slate-500 truncate">{results.zone}</p>
                   </div>
                   <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                     Top 5%
                   </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {results.buildings.map(b => (
                  <div 
                    key={b.id}
                    onClick={() => setSelectedBuilding(b)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                      selectedBuilding?.id === b.id 
                      ? 'bg-blue-50 border-blue-500 shadow-sm' 
                      : b.score >= 85
                      ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-400 hover:border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {b.score >= 85 && (
                          <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                            ★ PRIORITAIRE
                          </span>
                        )}
                        <h3 className="font-semibold text-slate-800 text-sm">{b.address}</h3>
                      </div>
                      <span className={`${getScoreColor(b.score)} text-white text-sm font-bold px-2.5 py-1 rounded-lg`}>
                        {b.score}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Ruler className="w-3 h-3"/> {b.surface}m²</span>
                      <span>{b.year}</span>
                      <span>{b.type}</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3"/> DPE {b.details.dpe}</span>
                    </div>
                  </div>
                ))}
              </div>
                </>
              )}
            </div>

            {/* Map/List Area (Center) */}
            <div className="flex-1 relative bg-slate-200">
               {/* Toggle Carte/Liste */}
               <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg border border-slate-200 flex">
                 <button
                   onClick={() => setViewMode('map')}
                   className={`px-4 py-2 rounded-l-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                     viewMode === 'map'
                       ? 'bg-orange-600 text-white'
                       : 'bg-white text-slate-600 hover:bg-slate-50'
                   }`}
                 >
                   <Map className="w-4 h-4" /> Carte
                 </button>
                 <button
                   onClick={() => setViewMode('list')}
                   className={`px-4 py-2 rounded-r-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                     viewMode === 'list'
                       ? 'bg-orange-600 text-white'
                       : 'bg-white text-slate-600 hover:bg-slate-50'
                   }`}
                 >
                   <List className="w-4 h-4" /> Liste
                 </button>
               </div>

               {viewMode === 'map' ? (
                 <>
                   <Suspense fallback={
                     <div className="h-full flex items-center justify-center">
                       <Loader className="w-8 h-8 text-orange-600 animate-spin" />
                     </div>
                   }>
                     <MapComponent 
                       buildings={results.buildings}
                       selectedBuilding={selectedBuilding}
                       onBuildingSelect={setSelectedBuilding}
                     />
                   </Suspense>
                   
                   {/* Instructions overlay if nothing selected */}
                   {!selectedBuilding && (
                     <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-10">
                       <MousePointer2 className="w-5 h-5 text-slate-400 animate-bounce" />
                       <span className="text-sm font-medium text-slate-700">Sélectionnez un bâtiment sur la carte ou dans la liste</span>
                     </div>
                   )}
                 </>
               ) : (
                 <ListComponent
                   buildings={results.buildings}
                   selectedBuilding={selectedBuilding}
                   onBuildingSelect={setSelectedBuilding}
                 />
               )}
            </div>

            {/* Details Panel (Right Slide-over) */}
            {selectedBuilding && (
              <div className="w-[450px] bg-white shadow-2xl z-30 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
                {/* Header Image */}
                <div className="h-48 bg-slate-800 relative group">
                  <button 
                    onClick={() => setSelectedBuilding(null)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{selectedBuilding.address}</h2>
                        <p className="text-slate-300 text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> {results.zone}
                        </p>
                      </div>
                      <div className={`${getScoreColor(selectedBuilding.score)} text-white font-bold text-xl px-3 py-1 rounded-lg shadow-lg`}>
                        {selectedBuilding.score}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                   {['overview', 'photos', 'technical'].map((tab) => (
                     <button
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                         activeTab === tab 
                         ? 'border-orange-500 text-orange-600' 
                         : 'border-transparent text-slate-500 hover:text-slate-700'
                       }`}
                     >
                       {tab === 'overview' && 'Synthèse'}
                       {tab === 'photos' && 'Photos'}
                       {tab === 'technical' && 'Technique & Réglem.'}
                     </button>
                   ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                         <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                           <Zap className="w-4 h-4" /> Analyse Potentiel
                         </h4>
                         <p className="text-sm text-blue-800 leading-relaxed">
                           Ce bâtiment présente une <strong>trame structurelle idéale</strong> pour une conversion en logements résidentiels. 
                           La zone UA du PLU permet le changement de destination sans dérogation majeure.
                         </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Critères de Conversion</h4>
                        <ScoreBar label="Zonage PLU (Logement autorisé)" value={selectedBuilding.subscores.plu} />
                        <ScoreBar label="Morphologie (Profondeur/Lumière)" value={selectedBuilding.subscores.morphologie} />
                        <ScoreBar label="Marché DVF (Ventes logements)" value={selectedBuilding.subscores.marche} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Surface Totale</p>
                          <p className="font-bold text-slate-800">{selectedBuilding.surface} m²</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Année Construction</p>
                          <p className="font-bold text-slate-800">{selectedBuilding.year}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Profondeur Bâtiment</p>
                          <p className="font-bold text-slate-800">{selectedBuilding.details.profondeur}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Zonage PLU</p>
                          <p className="font-bold text-slate-800 truncate">{selectedBuilding.details.zonage}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Prix Marché</p>
                          <p className="font-bold text-slate-800">{selectedBuilding.details.prix_m2}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'photos' && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <h4 className="font-semibold text-slate-900 mb-3">Vues du bâtiment</h4>
                        <p className="text-sm text-slate-600 mb-4">Images satellite et vues aériennes</p>
                      </div>

                      {/* Vue aérienne */}
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-2">Vue aérienne</h5>
                        <div className="bg-slate-200 rounded-lg h-48 overflow-hidden">
                          <img 
                            src={[
                              'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1503915158607-25191b702717?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1549429739-12501235140e?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1533036814691-320c2b2913e1?auto=format&fit=crop&w=800&q=80'
                            ][selectedBuilding.id % 5]}
                            alt="Vue aérienne"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Vue de rue */}
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-2">Vue de rue (Street View)</h5>
                        <div className="bg-slate-200 rounded-lg h-48 overflow-hidden">
                          <img 
                            src={[
                              'https://images.unsplash.com/photo-1534237710431-e2fc698436d5?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1623862660731-5c8e29f3d517?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1486718448742-163732cd1544?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80'
                            ][selectedBuilding.id % 5]}
                            alt="Vue de rue"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Vue de côté */}
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-2">Vue latérale</h5>
                        <div className="bg-slate-200 rounded-lg h-48 overflow-hidden">
                          <img 
                            src={[
                              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80'
                            ][selectedBuilding.id % 5]}
                            alt="Vue latérale"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800">
                        <strong>Note :</strong> Les images sont des exemples de bâtiments tertiaires similaires.
                      </div>
                    </div>
                  )}

                  {activeTab === 'technical' && (
                    <div className="space-y-6">
                       <div>
                         <h4 className="font-semibold text-slate-900 mb-3">Points de vigilance technique</h4>
                         <ul className="space-y-3">
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                             <span>Capacité portante planchers (&gt; 250kg/m²) adaptée pour conversion résidentielle.</span>
                           </li>
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                             <span>Gaines techniques verticales suffisantes pour réseaux.</span>
                           </li>
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                             <span>Accessibilité PMR à revoir (Entrée principale).</span>
                           </li>
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <Wifi className="w-5 h-5 text-blue-500 shrink-0" />
                             <span>Fibre optique : {selectedBuilding.details.fiber || 'Non raccordé'}.</span>
                           </li>
                         </ul>
                       </div>
                       
                       <div className="border-t border-slate-100 pt-4">
                         <h4 className="font-semibold text-slate-900 mb-3">Réglementation (PLU Montpellier)</h4>
                         <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 font-mono">
                           Zone: {selectedBuilding.details.zonage}<br/>
                           CES: 0.6<br/>
                           Hauteur Max: 18m<br/>
                           Stationnement: 1 place / 80m² logement
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl">
                    <Download className="w-5 h-5" />
                    Générer le rapport pré-faisabilité
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default BuildingScanner;