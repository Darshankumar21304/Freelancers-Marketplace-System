import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Loader2, Download, ExternalLink, AlertCircle } from 'lucide-react';

export default function PdfCanvasViewer({ url, filename = 'Document.pdf' }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Ensure Mozilla PDF.js library is loaded
  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js library failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF viewer script'));
      document.head.appendChild(script);
    });
  };

  // 2. Fetch binary ArrayBuffer and initialize PDF document (Matches reference architecture)
  useEffect(() => {
    let isMounted = true;
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setPageNum(1);

    const streamUrl = `http://localhost:5001/api/upload/view-pdf?url=${encodeURIComponent(url)}`;

    loadPdfJs()
      .then(async (pdfjs) => {
        let arrayBuffer = null;

        // Strategy A: ArrayBuffer fetch via backend stream proxy
        try {
          const res = await fetch(streamUrl);
          if (res.ok) {
            arrayBuffer = await res.arrayBuffer();
          }
        } catch (e) {
          console.warn('Proxy arraybuffer fetch failed:', e.message);
        }

        // Strategy B: ArrayBuffer fetch directly from Cloudinary URL
        if (!arrayBuffer) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              arrayBuffer = await res.arrayBuffer();
            }
          } catch (e) {
            console.warn('Direct arraybuffer fetch failed:', e.message);
          }
        }

        if (arrayBuffer && isMounted) {
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const doc = await loadingTask.promise;
          if (isMounted) {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setIsLoading(false);
          }
        } else {
          // Strategy C: Direct URL loading task fallback
          const loadingTask = pdfjs.getDocument({ url: streamUrl, withCredentials: false });
          const doc = await loadingTask.promise;
          if (isMounted) {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error('PDF Canvas Init Error:', err);
        if (isMounted) {
          setError(`Unable to load PDF preview: ${err.message || err.toString()}. Details: ${err.stack || 'No stack trace available'}`);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  // 3. Render specific page onto HTML5 Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Canvas render page error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale]);

  const handlePrevPage = () => {
    if (pageNum > 1) setPageNum(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (pageNum < numPages) setPageNum(prev => prev + 1);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1.15);
  };

  const proxyUrl = `http://localhost:5001/api/upload/view-pdf?url=${encodeURIComponent(url)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Top Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: '#1e293b', borderBottom: '1px solid #334155', color: '#f8fafc', flexWrap: 'wrap', gap: '8px' }}>
        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handlePrevPage}
            disabled={pageNum <= 1 || isLoading}
            style={{ padding: '5px 10px', background: pageNum <= 1 ? '#334155' : '#1a73e8', color: '#fff', border: 'none', borderRadius: '6px', cursor: pageNum <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: pageNum <= 1 ? 0.6 : 1 }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 8px', color: '#cbd5e1' }}>
            Page {pageNum} of {numPages || 1}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pageNum >= numPages || isLoading}
            style={{ padding: '5px 10px', background: pageNum >= numPages ? '#334155' : '#1a73e8', color: '#fff', border: 'none', borderRadius: '6px', cursor: pageNum >= numPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', fontWeight: 600, opacity: pageNum >= numPages ? 0.6 : 1 }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleZoomOut}
            disabled={isLoading || scale <= 0.6}
            style={{ padding: '5px 8px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '42px', textAlign: 'center', color: '#cbd5e1' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={isLoading || scale >= 2.5}
            style={{ padding: '5px 8px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleResetZoom}
            disabled={isLoading}
            style={{ padding: '5px 8px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Fit / Reset Zoom"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Action Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={proxyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '4px 12px', background: '#2563eb', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ExternalLink size={12} /> Full Screen
          </a>
          <a
            href={url}
            download={filename}
            style={{ padding: '4px 12px', background: '#334155', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={12} /> Download
          </a>
        </div>
      </div>

      {/* Canvas Viewport Body */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', minHeight: '400px', background: '#0f172a' }}>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
            <Loader2 size={36} className="animate-spin" color="#1a73e8" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading PDF Document Canvas...</span>
          </div>
        )}

        {error && !isLoading && (
          <div style={{ padding: '30px', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', maxWidth: '420px' }}>
            <AlertCircle size={40} color="#f87171" style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '1rem' }}>Preview Error</h4>
            <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{error}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <a href={proxyUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: '#1a73e8', color: '#fff', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                Open in Tab
              </a>
              <a href={url} download={filename} style={{ padding: '8px 16px', background: '#334155', color: '#fff', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                Download
              </a>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            display: isLoading || error ? 'none' : 'block',
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '6px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            background: '#ffffff'
          }}
        />
      </div>
    </div>
  );
}
