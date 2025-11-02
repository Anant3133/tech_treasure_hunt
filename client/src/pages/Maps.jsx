import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearchPlus, FaSearchMinus, FaExpand, FaCompress } from 'react-icons/fa';
import NavLayout from '../components/NavLayout.jsx';

export default function Maps() {
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <NavLayout>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-900/50 to-black border-b border-green-500 p-4 md:p-6"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-center text-green-400">
            🗺️ Campus Map
          </h1>
          <p className="text-center text-slate-400 mt-2 text-sm md:text-base">
            Navigate through NSUT campus to find clues
          </p>
        </motion.div>

      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-green-500/30 p-3 md:p-4"
      >
        <div className="flex justify-center items-center gap-2 md:gap-4">
          {/* Zoom Out */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="bg-green-700 hover:bg-green-600 text-white p-2 md:p-3 rounded-lg transition-colors flex items-center gap-2"
            aria-label="Zoom out"
          >
            <FaSearchMinus className="text-lg md:text-xl" />
            <span className="hidden md:inline text-sm">Zoom Out</span>
          </motion.button>

          {/* Zoom Level Display */}
          <div className="bg-slate-800 px-3 md:px-4 py-2 rounded-lg border border-green-500/30">
            <span className="text-green-400 font-semibold text-sm md:text-base">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Zoom In */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="bg-green-700 hover:bg-green-600 text-white p-2 md:p-3 rounded-lg transition-colors flex items-center gap-2"
            aria-label="Zoom in"
          >
            <FaSearchPlus className="text-lg md:text-xl" />
            <span className="hidden md:inline text-sm">Zoom In</span>
          </motion.button>

          {/* Fullscreen Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="bg-slate-700 hover:bg-slate-600 text-white p-2 md:p-3 rounded-lg transition-colors ml-2 md:ml-4"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <FaCompress className="text-lg md:text-xl" />
            ) : (
              <FaExpand className="text-lg md:text-xl" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-2 md:p-6"
      >
        <div className="bg-slate-900 rounded-lg border-2 border-green-500/30 overflow-auto max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-220px)]">
          <div className="flex justify-center items-center p-2 md:p-4 min-h-[400px]">
            <motion.img
              src="/nsutmap25.jpg"
              alt="NSUT Campus Map"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="max-w-full h-auto rounded-lg shadow-2xl"
              draggable="false"
            />
          </div>
        </div>

        {/* Mobile Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-green-900/20 border border-green-500/30 rounded-lg p-4"
        >
          <h3 className="text-green-400 font-semibold mb-2 text-sm md:text-base">
            💡 How to Use:
          </h3>
          <ul className="text-slate-300 space-y-1 text-xs md:text-sm">
            <li>• Use zoom buttons to adjust map size</li>
            <li>• Scroll within the map container to navigate</li>
            <li>• Toggle fullscreen for better view</li>
            <li className="md:hidden">• Pinch to zoom on mobile devices</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
    </NavLayout>
  );
}
