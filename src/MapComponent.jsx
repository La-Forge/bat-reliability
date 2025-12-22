import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Préchargement des icônes
const preloadIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

// Initialisation unique
if (typeof window !== 'undefined') {
  preloadIcons();
}

const createBuildingIcon = (score) => {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M3 21h18V9l-9-7-9 7v12zm9-13.5L18 12v7H6v-7l6-4.5z"/></svg></div>`,
    className: 'custom-building-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const MapComponent = ({ buildings, selectedBuilding, onBuildingSelect }) => {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, []);

  return (
    <MapContainer
      ref={mapRef}
      center={[43.6108, 3.8767]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={[building.lat, building.lng]}
          icon={createBuildingIcon(building.score)}
          eventHandlers={{
            click: () => onBuildingSelect(building)
          }}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold">{building.address}</h3>
              <p>Score: {building.score}/100</p>
              <p>Surface: {building.surface}m²</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;