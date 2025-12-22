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
    surface: building.surface_emprise_sol || building.s_geom_groupe || Math.floor(800 + Math.random() * 1500),
    type: getUsageType(building.usage_niveau_1_txt || building.usage_principal_bdnb_open),
    year: building.annee_construction || (1990 + Math.floor(Math.random() * 30)),
    floors: building.nb_niveau || (3 + Math.floor(Math.random() * 4)),
    details: {
      dpe: building.classe_bilan_dpe || building.classe_conso_energie_arrete_2012 || ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      hsp: building.hauteur_mean ? `${(building.hauteur_mean / building.nb_niveau || 2.5).toFixed(1)}m` : '2.5m',
      structure: getStructureType(building.materiaux_structure_mur_exterieur || building.mat_mur_txt),
      fiber: 'À vérifier',
      plu: 'Zone à déterminer',
      access: building.accessibilite_pmr ? 'Conforme' : 'À vérifier'
    },
    subscores: {
      technique: calculateTechnicalScore(building),
      reglementaire: calculateRegulatoryScore(building),
      marche: calculateMarketScore(building),
      esg: calculateESGScore(building)
    }
  }));
};

// Calcul du score global
const calculateScore = (building) => {
  let score = 50;
  if (building.classe_dpe && ['A', 'B'].includes(building.classe_dpe)) score += 20;
  if (building.surface_plancher_totale > 1000) score += 15;
  if (building.annee_construction > 2000) score += 10;
  if (building.nb_niveaux >= 3) score += 5;
  return Math.min(Math.max(score, 0), 100);
};

const calculateTechnicalScore = (building) => {
  let score = 60;
  if (building.hauteur_sous_plafond > 2.7) score += 20;
  if (building.materiaux_structure === 'beton') score += 15;
  return Math.min(score, 100);
};

const calculateRegulatoryScore = (building) => {
  let score = 70;
  if (building.accessibilite_pmr) score += 20;
  return Math.min(score, 100);
};

const calculateMarketScore = (building) => {
  return Math.floor(Math.random() * 30) + 70;
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