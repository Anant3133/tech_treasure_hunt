import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function QRScanner({ onScan, onError, onClose, modal = true }) {
  const divRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    
    const startScanning = async () => {
      try {
        const stream = await reader.decodeFromVideoDevice(
          undefined,
          divRef.current,
          (result, err) => {
            if (result) {
              if (onScan) onScan(result.getText());
            } else if (err && !err.message?.includes('No QR code found')) {
              // Only log non-decode errors
              console.warn('QR scan error:', err);
            }
          }
        );
        streamRef.current = stream;
      } catch (e) {
        if (onError) onError(e?.message || String(e));
      }
    };

    startScanning();

    return () => {
      // Proper cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (readerRef.current) {
        // @zxing/browser doesn't have reset(), just clear the reference
        readerRef.current = null;
      }
    };
  }, [onScan, onError]);

  if (!modal) {
    return (
      <div className="w-full">
        <video ref={divRef} className="w-full aspect-square bg-black rounded" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded shadow max-w-sm w-full">
        <video ref={divRef} className="w-full aspect-square bg-black rounded" />
        <button onClick={onClose} className="mt-3 w-full bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded">Close</button>
      </div>
    </div>
  );
}


