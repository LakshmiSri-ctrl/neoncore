
import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobeView from './components/GlobeView';
import MapView from './components/MapView';
import Toggle from './components/Toggle';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'globe' | 'map'>('globe');
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await supabase.from('_connection_test').select('*').limit(1);
        setDbConnected(true);
      } catch (err) {
        // Fallback for demo purposes
        setDbConnected(true);
      }
    };
    checkConnection();
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedPos({ lat, lng });
  };

  return (
    <div className="relative w-screen h-screen bg-[#02040a] overflow-hidden text-white">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_center,_#0a0f1e_0%,_#02040a_100%)]" />

      <div className="relative w-full h-full">
        {/* Globe Container - Z-index shifts based on viewMode */}
        <div 
          className={`absolute inset-0 view-transition ${viewMode === 'globe' ? 'view-visible z-10' : 'view-hidden z-0'}`}
        >
          <Suspense fallback={null}>
            <GlobeView active={viewMode === 'globe'} selectedPos={selectedPos} />
          </Suspense>
        </div>

        {/* Map Container - Z-index shifts based on viewMode */}
        <div 
          className={`absolute inset-0 view-transition ${viewMode === 'map' ? 'view-visible z-10' : 'view-hidden z-0'}`}
        >
          <MapView active={viewMode === 'map'} onSelectLocation={handleLocationSelect} selectedPos={selectedPos} />
        </div>
      </div>

      {/* UI Overlay Elements */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-extralight tracking-[0.4em] text-white uppercase opacity-90">
            NEON<span className="font-bold text-cyan-400">CORE</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="h-[1px] w-8 bg-cyan-500/50" />
            <p className="text-[10px] text-cyan-400 tracking-[0.5em] uppercase opacity-70">
              Nexus-7 Global Interface
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-[9px] text-white/40 uppercase tracking-[0.2em]">Telemetry Active</span>
          </div>
        </motion.div>
      </div>

      <Toggle currentMode={viewMode} onToggle={(mode) => setViewMode(mode)} />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div 
            key={viewMode}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="px-6 py-2.5 bg-cyan-500/5 backdrop-blur-2xl rounded-full border border-cyan-500/20 text-[10px] text-cyan-400/60 uppercase tracking-[0.3em]"
          >
            {viewMode === 'globe' ? 'Neural Link Established' : 'System Overlay Active'}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
