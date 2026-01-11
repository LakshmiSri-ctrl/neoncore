
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Neon Marker Icon
const neonIcon = new L.DivIcon({
  className: 'custom-neon-marker',
  html: `<div class="w-8 h-8 -ml-4 -mt-4 relative flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping"></div>
          <div class="w-3 h-3 rounded-full bg-cyan-400 border border-white/50 shadow-[0_0_15px_#22d3ee]"></div>
         </div>`,
  iconSize: [32, 32]
});

interface AQIData {
  aqi: number;
  pm25: number;
  status: string;
  color: string;
}

// Simulated AQI Fetch (Using coordinates to derive a consistent "real-feeling" value)
const getSimulatedAQI = (lat: number, lng: number): AQIData => {
  const hash = Math.abs(Math.sin(lat) * 1000 + Math.cos(lng) * 1000);
  const aqi = Math.floor((hash % 150) + 10);
  let status = "Good";
  let color = "#22d3ee"; // Cyan
  let pm25 = Math.floor(aqi * 0.45);

  if (aqi > 150) { status = "Unhealthy"; color = "#ef4444"; }
  else if (aqi > 100) { status = "Sensitive"; color = "#f97316"; }
  else if (aqi > 50) { status = "Moderate"; color = "#eab308"; }

  return { aqi, pm25, status, color };
};

const easeInOutQuint = (x: number): number => {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
};

interface MapProps {
  active: boolean;
  onSelectLocation: (lat: number, lng: number) => void;
  selectedPos: { lat: number; lng: number } | null;
}

const CustomZoomControls = () => {
  const map = useMap();
  const animationRef = useRef<number | null>(null);

  const performSmoothZoom = (targetZoom: number) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const startZoom = map.getZoom();
    const startTime = performance.now();
    const duration = 1000;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutQuint(progress);
      const nextZoom = startZoom + (targetZoom - startZoom) * easedProgress;
      map.setZoom(nextZoom, { animate: false });
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="absolute top-1/2 left-8 -translate-y-1/2 z-[1000] flex flex-col gap-4">
      <motion.button
        whileHover={{ scale: 1.1, x: 5, backgroundColor: 'rgba(6, 182, 212, 0.2)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => performSmoothZoom(Math.min(map.getZoom() + 1, 12))}
        className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1, x: 5, backgroundColor: 'rgba(6, 182, 212, 0.2)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => performSmoothZoom(Math.max(map.getZoom() - 1, 1.5))}
        className="w-12 h-12 bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
      </motion.button>
    </div>
  );
};

const MapEvents = ({ onSelectLocation }: { onSelectLocation: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) { onSelectLocation(e.latlng.lat, e.latlng.lng); },
  });
  return null;
};

const MapEffect = ({ active, selectedPos }: { active: boolean; selectedPos: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (active && !selectedPos) {
      setTimeout(() => map.flyTo([20, 0], 2.5, { duration: 2.5 }), 100);
    }
  }, [active, map, selectedPos]);
  return null;
};

const MapView: React.FC<MapProps> = ({ active, onSelectLocation, selectedPos }) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [aqi, setAqi] = useState<AQIData | null>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  useEffect(() => {
    if (selectedPos) {
      setAqi(getSimulatedAQI(selectedPos.lat, selectedPos.lng));
    } else {
      setAqi(null);
    }
  }, [selectedPos]);

  return (
    <div className={`w-full h-full transition-all duration-1000 ${active ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}>
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        minZoom={1.5}
        scrollWheelZoom={active}
        zoomControl={false}
        zoomSnap={0}
        className="w-full h-full"
        style={{ background: '#02040a' }}
      >
        {/* Changed from dark_nolabels to dark_all to show country names */}
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {geoData && (
          <GeoJSON 
            data={geoData} 
            style={{
              color: '#22d3ee',
              weight: 0.5,
              opacity: 0.3,
              fillColor: '#06b6d4',
              fillOpacity: 0.02
            }}
          />
        )}

        <MapEvents onSelectLocation={onSelectLocation} />
        <MapEffect active={active} selectedPos={selectedPos} />
        <CustomZoomControls />
        {selectedPos && <Marker position={[selectedPos.lat, selectedPos.lng]} icon={neonIcon} />}
      </MapContainer>
      
      {/* Tactical HUD Overlay for AQI and Coordinates */}
      <div className="absolute bottom-8 right-8 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {aqi && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="px-6 py-4 bg-black/80 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl shadow-2xl w-64 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase">Atmospheric Scan</span>
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[8px] text-white/40 uppercase mb-0.5 font-bold">AQ Index</p>
                  <p className="text-4xl font-light tracking-tighter" style={{ color: aqi.color }}>
                    {aqi.aqi}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-white/40 uppercase mb-0.5 font-bold">Status</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: aqi.color }}>
                    {aqi.status}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/30 uppercase">PM 2.5 Density</span>
                  <span className="text-xs text-white/90 font-mono">{aqi.pm25} μg/m³</span>
                </div>
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(aqi.aqi / 2, 100)}%`, backgroundColor: aqi.color }} 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 py-3 bg-black/70 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl"
        >
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 uppercase">Latitude</span>
              <span className="text-xs text-white/90 font-mono">
                {selectedPos ? selectedPos.lat.toFixed(4) : '00.0000'}
              </span>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 uppercase">Longitude</span>
              <span className="text-xs text-white/90 font-mono">
                {selectedPos ? selectedPos.lng.toFixed(4) : '00.0000'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MapView;
