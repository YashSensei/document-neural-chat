import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const DocViewer = ({ url, currentPage }) => {
    const [totalPages, setTotalPages] = useState(null);
    const [activePage, setActivePage] = useState(1);
    const [viewWidth, setViewWidth] = useState(600);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const measure = () => {
            if (wrapperRef.current) {
                setViewWidth(wrapperRef.current.offsetWidth - 40);
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    useEffect(() => {
        if (currentPage && currentPage !== activePage) {
            setActivePage(currentPage);
            const el = document.getElementById(`docpage-${currentPage}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentPage]);

    return (
        <div className="doc-viewer-inner" ref={wrapperRef}>
            <div className="doc-nav-bar">
                <button
                    disabled={activePage <= 1}
                    onClick={() => {
                        const p = activePage - 1;
                        setActivePage(p);
                        document.getElementById(`docpage-${p}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    Prev
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--neon-cyan)' }}>
                    {activePage} / {totalPages || '—'}
                </span>
                <button
                    disabled={activePage >= totalPages}
                    onClick={() => {
                        const p = activePage + 1;
                        setActivePage(p);
                        document.getElementById(`docpage-${p}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                >
                    Next
                </button>
            </div>
            <div className="doc-page-wrap">
                <Document
                    file={url}
                    onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
                    onLoadError={(err) => console.error('Doc load error:', err)}
                    loading={<div style={{ padding: '2rem', color: 'var(--text-dim)' }}>Initializing render...</div>}
                >
                    {Array.from({ length: totalPages || 0 }, (_, i) => (
                        <div key={i + 1} id={`docpage-${i + 1}`} style={{ marginBottom: '1.5rem' }}>
                            <Page
                                pageNumber={i + 1}
                                width={viewWidth}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                            />
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
};

export default DocViewer;
