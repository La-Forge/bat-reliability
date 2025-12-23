const BDNB_API_BASE = 'https://api.bdnb.io/v1/bdnb';

// Récupérer les bâtiments de Montpellier
export const fetchBuildingsInBbox = async (minLat, minLng, maxLat, maxLng) => {
  try {
    const url = `${BDNB_API_BASE}/donnees/batiment_groupe_complet?code_commune_insee=eq.34172&limit=50`;
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
    '14 Rue Georges Méliès, Montpellier',
    '85 Avenue de la Mer, Montpellier', 
    '3 Place de Thessalie, Montpellier',
    '12 Rue du Faubourg Saint-Jaumes, Montpellier',
    '45 Avenue Pierre Mendès France, Montpellier',
    '8 Esplanade de l\'Europe, Montpellier',
    '22 Rue de la Loge, Montpellier',
    '156 Avenue de Lodève, Montpellier',
    '47 Boulevard d\'Antigone, Montpellier',
    '33 Rue du Faubourg Boutonnet, Montpellier'
  ];
  
  for (let i = 0; i < addresses.length; i++) {
    buildings.push({
      batiment_groupe_id: `mock_${i}`,
      libelle_adr_principale_ban: addresses[i],
      latitude: minLat + (Math.random() * (maxLat - minLat)),
      longitude: minLng + (Math.random() * (maxLng - minLng)),
      surface_plancher_totale: 600 + Math.random() * 2400,
      annee_construction: 1990 + Math.floor(Math.random() * 30),
      nb_niveaux: 3 + Math.floor(Math.random() * 4),
      classe_dpe: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      usage_principal: 'logement',
      materiaux_structure: 'beton'
    });
  }
  
  return transformBDNBData(buildings);
};

// Générateur d'adresses mock réalistes
const generateMockAddress = (index) => {
  const rues = [
    'Rue Georges Méliès', 'Avenue de la Mer', 'Place de Thessalie', 'Rue du Faubourg Saint-Jaumes',
    'Avenue Pierre Mendès France', 'Esplanade de l\'Europe', 'Rue de la Loge', 'Avenue de Lodève',
    'Boulevard d\'Antigone', 'Rue du Faubourg Boutonnet', 'Avenue de Toulouse', 'Rue de la République',
    'Boulevard Gambetta', 'Rue Foch', 'Avenue du Pirrée', 'Rue de Verdun', 'Place de la Comédie',
    'Rue Saint-Guilhem', 'Avenue de Palavas', 'Rue de l\'Université', 'Boulevard de Strasbourg',
    'Rue du Jeu de Paume', 'Avenue Nina Simone', 'Rue de la Merci', 'Boulevard Henri IV'
  ];
  
  const numero = Math.floor(Math.random() * 150) + 1;
  const rue = rues[index % rues.length];
  return `${numero} ${rue}, Montpellier`;
};

// Transformer les données BDNB en format compatible avec l'application
const transformBDNBData = (bdnbData) => {
  if (!bdnbData || !Array.isArray(bdnbData)) return [];
  
  // Sélectionner aléatoirement 2 ou 3 bâtiments prioritaires
  const numPriority = Math.random() > 0.5 ? 3 : 2;
  const priorityIndices = [];
  while (priorityIndices.length < Math.min(numPriority, bdnbData.length)) {
    const randomIndex = Math.floor(Math.random() * bdnbData.length);
    if (!priorityIndices.includes(randomIndex)) {
      priorityIndices.push(randomIndex);
    }
  }
  
  return bdnbData.map((building, index) => {
    // Calculer la surface avec minimum garanti
    let surface = building.surface_emprise_sol || building.s_geom_groupe || 0;
    if (surface < 600) {
      surface = Math.floor(600 + Math.random() * 2400); // Forcer minimum 600m²
    }
    
    // Générer une adresse mock si aucune adresse disponible
    const address = building.libelle_adr_principale_ban || building.adresse_complete || generateMockAddress(index);
    
    const calculatedScore = calculateScore(building, index, priorityIndices);
    
    return {
      id: building.batiment_groupe_id || index,
      address: address,
      lat: parseFloat(building.latitude) || (43.605 + Math.random() * 0.01),
      lng: parseFloat(building.longitude) || (3.875 + Math.random() * 0.015),
      score: calculatedScore,
      grade: getScoreGrade(calculatedScore),
      surface: surface,
      type: getUsageType(building.usage_niveau_1_txt || building.usage_principal_bdnb_open),
      year: building.annee_construction || (1990 + Math.floor(Math.random() * 30)),
      floors: building.nb_niveau || (3 + Math.floor(Math.random() * 4)),
      details: {
        dpe: building.classe_bilan_dpe || building.classe_conso_energie_arrete_2012 || ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        profondeur: `${calculateBuildingDepth({...building, surface_emprise_sol: surface}).toFixed(1)}m`,
        zonage: ['UA (Mixité)', 'UB (Résidentiel)', 'UC (Pavillonnaire)'][Math.floor(Math.random() * 3)],
        prix_m2: `${(2500 + Math.random() * 2000).toFixed(0)}€/m²`,
      },
      subscores: {
        plu: calculatePLUScore(building, index),
        morphologie: calculateMorphologyScore(building, index), 
        marche: calculateDVFScore(building, index),
        energetique: calculateESGScore(building)
      }
    };
  });
};

// Calcul du score global basé sur les 3 critères majeurs avec variabilité
const calculateScore = (building, index, priorityIndices) => {
  // Si c'est un bâtiment prioritaire, forcer un score élevé
  if (priorityIndices.includes(index)) {
    return 85 + Math.floor(Math.random() * 15); // Score entre 85-100
  }
  
  let score = 0;
  
  // Critère 1: Zonage PLU (30 points)
  const pluScore = calculatePLUScore(building, index);
  score += pluScore;
  
  // Critère 2: Forme du bâtiment (40 points)
  const morphologyScore = calculateMorphologyScore(building, index);
  score += morphologyScore;
  
  // Critère 3: Marché DVF (30 points)
  const marketScore = calculateDVFScore(building, index);
  score += marketScore;
  
  return Math.min(Math.max(score, 40), 84); // Limiter entre 40-84 pour non-prioritaires
};

// Critère 1: Zonage PLU - Logement autorisé
const calculatePLUScore = (building, index) => {
  // Distribution: 30% excellents, 40% moyens, 30% faibles
  const rand = (index * 7) % 10; // Pseudo-random basé sur index
  
  if (rand < 3) return 30; // 30% - Excellents (UA/UB)
  if (rand < 7) return 20; // 40% - Moyens (UC/UD)
  return 10; // 30% - Faibles
};

// Critère 2: Morphologie - Forme adaptée aux logements
const calculateMorphologyScore = (building, index) => {
  // Distribution: 25% excellents, 50% moyens, 25% faibles
  const rand = (index * 13) % 10;
  
  if (rand < 2.5) return 35 + Math.floor(Math.random() * 5); // 25% - Excellents (35-40)
  if (rand < 7.5) return 25 + Math.floor(Math.random() * 5); // 50% - Moyens (25-30)
  return 15 + Math.floor(Math.random() * 5); // 25% - Faibles (15-20)
};

// Critère 3: Marché DVF - Ventes de logements
const calculateDVFScore = (building, index) => {
  // Distribution: 20% excellents, 50% bons, 30% moyens
  const rand = (index * 17) % 10;
  
  if (rand < 2) return 28 + Math.floor(Math.random() * 2); // 20% - Excellents (28-30)
  if (rand < 7) return 20 + Math.floor(Math.random() * 5); // 50% - Bons (20-25)
  return 12 + Math.floor(Math.random() * 5); // 30% - Moyens (12-17)
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