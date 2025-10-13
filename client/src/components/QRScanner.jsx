import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function QRScanner({ onScan, onError, onClose }) {
  const divRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    reader
      .decodeFromVideoDevice(
        undefined,
        divRef.current,
        (result, err) => {
          if (result) {
            if (onScan) onScan(result.getText());
          } else if (err) {
            // ignore frequent decode errors
          }
        }
      )
      .catch((e) => {
        if (onError) onError(e?.message || String(e));
      });

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [onScan, onError]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded shadow max-w-sm w-full">
        <video ref={divRef} className="w-full aspect-square bg-black" />
        <button onClick={onClose} className="mt-3 w-full bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded">Close</button>
      </div>
    </div>
  );
}


