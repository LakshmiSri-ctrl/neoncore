
import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  currentMode: 'globe' | 'map';
  onToggle: (mode: 'globe' | 'map') => void;
}

const Toggle: React.FC<ToggleProps> = ({ currentMode, onToggle }) => {
  return (
    <div className="absolute top-8 right-8 z-40">
      <div className="relative flex bg-black/50 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Animated Background Pill */}
        <motion.div
          className="absolute inset-y-1.5 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          initial={false}
          animate={{
            x: currentMode === 'globe' ? 0 : 'calc(100% - 3px)',
            width: 'calc(50% - 3px)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        <button
          onClick={() => onToggle('globe')}
          className={`relative z-10 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-500 flex items-center gap-3 ${
            currentMode === 'globe' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Globe
        </button>

        <button
          onClick={() => onToggle('map')}
          className={`relative z-10 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-500 flex items-center gap-3 ${
            currentMode === 'map' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Map
        </button>
      </div>
    </div>
  );
};

export default Toggle;
