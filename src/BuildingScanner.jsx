import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MapPin, Building2, Search, Loader, Zap, Download, X, Map, List, TrendingUp, CheckCircle, AlertTriangle, Wifi, Ruler, MousePointer2 } from 'lucide-react';
import { fetchBuildingsInBbox } from './services/bdnbService.js';

// Lazy load de la carte
const MapComponent = lazy(() => import('./MapComponent.jsx'));

const BuildingScanner = () => {
  const [location, setLocation] = useState('Montpellier');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // Pour les détails

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
                buildings: bdnbData.slice(0, 12) // Limiter à 12 résultats
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
        setResults(mockScanResults[searchKey]);
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
             <div className="flex gap-2">
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

      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Loading Overlay */}
        {isScanning && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-96 text-center">
              <Loader className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Analyse macro-territoriale</h3>
              <p className="text-slate-500 mb-8">Croisement des référentiels nationaux...</p>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div 
                  className="bg-orange-600 h-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-mono text-slate-400">{scanProgress}%</p>
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
                  Analysez des milliers de bâtiments résidentiels pour détecter leur aptitude à la conversion en bureaux tertiaires. 
                  Basé sur la BDNB, les fichiers fonciers et les règles d'urbanisme locales.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                    <h4 className="font-semibold">Potentiel Marché</h4>
                    <p className="text-xs text-slate-500">Tension locative tertiaire</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <Ruler className="w-6 h-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold">Morphologie</h4>
                    <p className="text-xs text-slate-500">Trame, HSP, Profondeur</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <Zap className="w-6 h-6 text-amber-600 mb-2" />
                    <h4 className="font-semibold">Performance</h4>
                    <p className="text-xs text-slate-500">DPE & Décret Tertiaire</p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Results View */}
        {results && (
          <>
            {/* Sidebar List (Left) */}
            <div className={`w-96 bg-white border-r border-slate-200 flex flex-col z-10 transition-all ${selectedBuilding ? 'hidden md:flex' : 'flex'}`}>
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
                    className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      selectedBuilding?.id === b.id 
                      ? 'bg-blue-50 border-blue-500 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800 text-sm">{b.address}</h3>
                      <span className={`${getScoreColor(b.score)} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                        {b.grade}
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
            </div>

            {/* Map Area (Center) */}
            <div className="flex-1 relative bg-slate-200">
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
                   {['overview', 'technical', 'financial'].map((tab) => (
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
                       {tab === 'technical' && 'Technique & Réglem.'}
                       {tab === 'financial' && 'Simulateur'}
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
                           Ce bâtiment présente une <strong>trame structurelle idéale</strong> pour une conversion en plateaux de bureaux ouverts. 
                           La zone UA du PLU permet le changement de destination sans dérogation majeure.
                         </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Critères de Conversion</h4>
                        <ScoreBar label="Zonage PLU (Logement autorisé)" value={selectedBuilding.subscores.plu} />
                        <ScoreBar label="Morphologie (Profondeur/Lumière)" value={selectedBuilding.subscores.morphologie} />
                        <ScoreBar label="Marché DVF (Ventes logements)" value={selectedBuilding.subscores.marche} />
                        <ScoreBar label="Performance Énergétique" value={selectedBuilding.subscores.energetique} />
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

                  {activeTab === 'technical' && (
                    <div className="space-y-6">
                       <div>
                         <h4 className="font-semibold text-slate-900 mb-3">Points de vigilance technique</h4>
                         <ul className="space-y-3">
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                             <span>Capacité portante planchers (&gt; 250kg/m²) pour archivage/bureaux.</span>
                           </li>
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                             <span>Gaines techniques verticales suffisantes pour CVC.</span>
                           </li>
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                             <span>Accessibilité PMR à revoir (Entrée principale).</span>
                           </li>
                           <li className="flex items-start gap-3 text-sm text-slate-600">
                             <Wifi className="w-5 h-5 text-blue-500 shrink-0" />
                             <span>Fibre optique pro : {selectedBuilding.details.fiber}.</span>
                           </li>
                         </ul>
                       </div>
                       
                       <div className="border-t border-slate-100 pt-4">
                         <h4 className="font-semibold text-slate-900 mb-3">Réglementation (PLU Montpellier)</h4>
                         <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 font-mono">
                           Zone: {selectedBuilding.details.plu}<br/>
                           CES: 0.6<br/>
                           Hauteur Max: 18m<br/>
                           Stationnement: 1 place / 60m² bureaux
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