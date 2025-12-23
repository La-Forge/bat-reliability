import React from 'react';
import { Ruler, Zap, MapPin, TrendingUp } from 'lucide-react';

const ListComponent = ({ buildings, selectedBuilding, onBuildingSelect }) => {
  const getScoreColor = (score) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getScoreBgColor = (score) => {
    if (score >= 85) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-3">
        {buildings.map((building) => (
          <div
            key={building.id}
            onClick={() => onBuildingSelect(building)}
            className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg relative ${
              selectedBuilding?.id === building.id
                ? 'border-blue-500 shadow-md'
                : building.score >= 85
                ? 'border-emerald-400 shadow-md hover:border-emerald-500'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            {building.score >= 85 && (
              <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                <span>★</span> BÂTIMENT PRIORITAIRE À INVESTIGUER
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              {/* Left: Info */}
              <div className="flex-1">
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-slate-900">{building.address}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {building.lat.toFixed(4)}, {building.lng.toFixed(4)}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Surface</p>
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <Ruler className="w-4 h-4" /> {building.surface}m²
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Type</p>
                    <p className="font-bold text-slate-800 text-sm">{building.type}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Année</p>
                    <p className="font-bold text-slate-800">{building.year}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">DPE</p>
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <Zap className="w-4 h-4" /> {building.details.dpe}
                    </p>
                  </div>
                </div>

                {/* Score bars */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border ${getScoreBgColor(building.subscores.plu)}`}>
                    <p className="text-xs font-medium text-slate-600 mb-1">PLU</p>
                    <p className="font-bold text-lg">{building.subscores.plu}/100</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${getScoreBgColor(building.subscores.morphologie)}`}>
                    <p className="text-xs font-medium text-slate-600 mb-1">Morphologie</p>
                    <p className="font-bold text-lg">{building.subscores.morphologie}/100</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${getScoreBgColor(building.subscores.marche)}`}>
                    <p className="text-xs font-medium text-slate-600 mb-1">Marché</p>
                    <p className="font-bold text-lg">{building.subscores.marche}/100</p>
                  </div>
                </div>
              </div>

              {/* Right: Score global */}
              <div className="text-center">
                <div className={`${getScoreColor(building.score)} text-white font-bold text-4xl w-24 h-24 rounded-full flex items-center justify-center shadow-lg`}>
                  {building.score}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Score global</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListComponent;
