import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaQrcode, FaTimes, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
import NavLayout from '../components/NavLayout.jsx';
import QRScanner from '../components/QRScanner.jsx';
import { scanCheckpoint } from '../api/checkpoint';
import toast from 'react-hot-toast';

export default function Checkpoint({ checkpointNumber }) {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const handleQrScan = async (data) => {
    if (scanning || navigating) return;
    
    setScanning(true);
    try {
      // Extract checkpoint number from QR data
      // Expected format: "checkpoint-1", "checkpoint-2", or "checkpoint-3"
      const match = data.match(/checkpoint-(\d+)/i);
      if (!match) {
        toast.error('Invalid checkpoint QR code');
        setScanning(false);
        return;
      }

      const scannedCheckpoint = parseInt(match[1]);
      if (scannedCheckpoint !== checkpointNumber) {
        toast.error(`Wrong checkpoint! Expected checkpoint ${checkpointNumber}`);
        setScanning(false);
        return;
      }

      const result = await scanCheckpoint(checkpointNumber);
      
      // Prevent any further state updates
      setNavigating(true);
      setShowScanner(false);
      
      // Check if this was the final checkpoint (checkpoint 3)
      if (result.finished) {
        toast.success('Final checkpoint scanned! Hunt completed!', { duration: 2000 });
        
        // Navigate to completion page immediately
        navigate('/completion', { replace: true });
      } else {
        // Checkpoints 1 and 2 - game pauses, wait for admin
        toast.success(`Checkpoint ${checkpointNumber} scanned! Game paused.`, { duration: 2000 });
        
        // Navigate back to game to show paused state immediately
        navigate('/game', { replace: true });
      }
      
    } catch (err) {
      console.error('Checkpoint scan error:', err);
      toast.error(err.response?.data?.message || 'Failed to scan checkpoint');
      setScanning(false);
    }
  };

  return (
    <NavLayout>
      <div className="min-h-screen bg-gradient-to-br from-black via-green-950 to-black text-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto pt-20"
        >
          {/* Checkpoint Card */}
          <div className="bg-gradient-to-br from-green-900/40 to-black/60 backdrop-blur-sm border border-green-500 rounded-2xl p-8 shadow-2xl">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500">
                <FaMapMarkerAlt className="text-5xl text-green-400" />
              </div>
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-center text-green-400 mb-4">
              🎯 Checkpoint {checkpointNumber}
            </h1>

            {/* Instructions */}
            <div className="space-y-4 mb-8">
              <p className="text-lg text-center text-slate-300">
                Great progress! It's time to return to the <span className="text-green-400 font-semibold">starting point</span>.
              </p>

              <div className="bg-black/40 rounded-xl p-6 border border-green-500/30">
                <h3 className="text-xl font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <FaCheckCircle /> What to do:
                </h3>
                <ol className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold text-lg">1.</span>
                    <span>Head back to the <strong>starting location</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold text-lg">2.</span>
                    <span>Find and scan the <strong>Checkpoint {checkpointNumber} QR code</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold text-lg">3.</span>
                    <span>Wait for the <strong>admin to unpause</strong> your game</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold text-lg">4.</span>
                    <span>Continue with the next set of questions!</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Scan Button */}
            {!showScanner && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowScanner(true)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-green-500/50"
              >
                <FaQrcode className="text-2xl" />
                Scan Checkpoint QR Code
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-green-900/40 to-black/80 border border-green-500 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-400">Scan Checkpoint {checkpointNumber}</h2>
                <button
                  onClick={() => {
                    setShowScanner(false);
                    setScanning(false);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  disabled={scanning}
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <QRScanner onScan={handleQrScan} />

              <p className="text-center text-slate-400 text-sm mt-4">
                {scanning ? 'Processing...' : 'Position the QR code within the frame'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </NavLayout>
  );
}
