const BDNB_API_BASE = 'https://api.bdnb.io/v1/bdnb';

// Récupérer les bâtiments de Montpellier
export const fetchBuildingsInBbox = async (minLat, minLng, maxLat, maxLng) => {
  try {
    const url = `${BDNB_API_BASE}/donnees/batiment_groupe_complet?code_commune_insee=eq.34172&limit=20`;
    console.log('Appel API BDNB:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Données BDNB reçues:', data.length, 'bâtiments');
      if (data && data.length > 0) {
        return transformBDNBData(data);
      }
    }
  } catch (error) {
    console.error('Erreur API BDNB:', error);
  }
  
  console.log('Fallback sur données de démonstration');
  return generateMockDataForZone(minLat, minLng, maxLat, maxLng);
};

// Générer des données réalistes pour la zone
const generateMockDataForZone = (minLat, minLng, maxLat, maxLng) => {
  const buildings = [];
  const addresses = [
    '14 Rue Georges Méliès',
    '85 Avenue de la Mer', 
    'Place de Thessalie',
    '12 Rue du Faubourg Saint-Jaumes',
    '45 Avenue Pierre Mendès France',
    '8 Esplanade de l\'Europe'
  ];
  
  for (let i = 0; i < 6; i++) {
    buildings.push({
      batiment_groupe_id: `mock_${i}`,
      adresse_complete: addresses[i],
      latitude: minLat + (Math.random() * (maxLat - minLat)),
      longitude: minLng + (Math.random() * (maxLng - minLng)),
      surface_plancher_totale: 800 + Math.random() * 1500,
      annee_construction: 1990 + Math.floor(Math.random() * 30),
      nb_niveaux: 3 + Math.floor(Math.random() * 4),
      classe_dpe: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      usage_principal: 'logement',
      materiaux_structure: 'beton'
    });
  }
  
  return transformBDNBData(buildings);
};

// Transformer les données BDNB en format compatible avec l'application
const transformBDNBData = (bdnbData) => {
  if (!bdnbData || !Array.isArray(bdnbData)) return [];
  
  return bdnbData.map((building, index) => ({
    id: building.batiment_groupe_id || index,
    address: building.libelle_adr_principale_ban || building.adresse_complete || `Bâtiment ${index + 1}`,
    lat: parseFloat(building.latitude) || (43.605 + Math.random() * 0.01),
    lng: parseFloat(building.longitude) || (3.875 + Math.random() * 0.015),
    score: calculateScore(building),
    grade: getScoreGrade(calculateScore(building)),
    surface: building.surface_emprise_sol || building.s_geom_groupe || Math.floor(800 + Math.random() * 1500),
    type: getUsageType(building.usage_niveau_1_txt || building.usage_principal_bdnb_open),
    year: building.annee_construction || (1990 + Math.floor(Math.random() * 30)),
    floors: building.nb_niveau || (3 + Math.floor(Math.random() * 4)),
    details: {
      dpe: building.classe_bilan_dpe || building.classe_conso_energie_arrete_2012 || ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      profondeur: `${calculateBuildingDepth(building).toFixed(1)}m`,
      zonage: ['UA (Mixité)', 'UB (Résidentiel)', 'UC (Pavillonnaire)'][Math.floor(Math.random() * 3)],
      prix_m2: `${(2500 + Math.random() * 2000).toFixed(0)}€/m²`,
    },
    subscores: {
      plu: calculatePLUScore(building),
      morphologie: calculateMorphologyScore(building), 
      marche: calculateDVFScore(building),
      energetique: calculateESGScore(building)
    }
  }));
};

// Calcul du score global basé sur les 3 critères majeurs
const calculateScore = (building) => {
  let score = 0;
  
  // Critère 1: Zonage PLU (30 points)
  const pluScore = calculatePLUScore(building);
  score += pluScore;
  
  // Critère 2: Forme du bâtiment (40 points)
  const morphologyScore = calculateMorphologyScore(building);
  score += morphologyScore;
  
  // Critère 3: Marché DVF (30 points)
  const marketScore = calculateDVFScore(building);
  score += marketScore;
  
  return Math.min(Math.max(score, 0), 100);
};

// Critère 1: Zonage PLU - Logement autorisé
const calculatePLUScore = (building) => {
  // Simulation basée sur la zone
  const zones = ['UA', 'UB', 'UC', 'UD', 'N', 'A'];
  const zone = zones[Math.floor(Math.random() * zones.length)];
  
  if (['UA', 'UB'].includes(zone)) return 30; // Mixité autorisée
  if (['UC', 'UD'].includes(zone)) return 20; // Résidentiel principal
  return 5; // Zones restrictives
};

// Critère 2: Morphologie - Forme adaptée aux logements
const calculateMorphologyScore = (building) => {
  let score = 0;
  
  // Profondeur des plateaux (lumière naturelle)
  const depth = calculateBuildingDepth(building);
  if (depth <= 15) score += 20; // Optimal
  else if (depth <= 20) score += 15; // Acceptable
  else score += 5; // Difficile
  
  // Hauteur sous plafond
  const height = building.hauteur_mean / (building.nb_niveau || 3);
  if (height >= 2.5) score += 10;
  
  // Structure modulable
  if (building.materiaux_structure_mur_exterieur === 'beton') score += 10;
  
  return score;
};

// Critère 3: Marché DVF - Ventes de logements
const calculateDVFScore = (building) => {
  // Simulation prix m² et dynamisme marché
  const pricePerM2 = 2500 + Math.random() * 2000; // 2500-4500€/m²
  const salesVolume = Math.random(); // Volume de ventes
  
  let score = 0;
  if (pricePerM2 > 3500) score += 20; // Marché premium
  else if (pricePerM2 > 3000) score += 15; // Marché solide
  else score += 10; // Marché accessible
  
  if (salesVolume > 0.7) score += 10; // Forte demande
  
  return score;
};

// Calcul profondeur bâtiment (simulation)
const calculateBuildingDepth = (building) => {
  const surface = building.surface_emprise_sol || building.s_geom_groupe || 1000;
  // Approximation: profondeur = racine(surface) pour un bâtiment carré
  return Math.sqrt(surface) * 0.6; // Facteur de forme
};

// Attribution d'une note de A à F
const getScoreGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
};

const calculateESGScore = (building) => {
  let score = 60;
  if (building.classe_dpe && ['A', 'B', 'C'].includes(building.classe_dpe)) score += 25;
  return Math.min(score, 100);
};

const getUsageType = (usage) => {
  const usageMap = {
    'logement': 'Résidentiel',
    'bureau': 'Tertiaire',
    'commerce': 'Commercial',
    'industrie': 'Industriel'
  };
  return usageMap[usage] || 'Mixte';
};

const getStructureType = (materiaux) => {
  const structureMap = {
    'beton': 'Béton armé (Modulable)',
    'acier': 'Charpente acier',
    'bois': 'Structure bois',
    'pierre': 'Murs porteurs'
  };
  return structureMap[materiaux] || 'Structure mixte';
};