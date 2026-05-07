import React, { useState } from 'react';
import NeuralChat from './components/Chat';
import IngestUpload from './components/Upload';
import DocViewer from './components/PdfViewer';
import './index.css';

function App() {
  const [docReady, setDocReady] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [targetPage, setTargetPage] = useState(1);

  const onDocIngested = (file) => {
    const objectUrl = URL.createObjectURL(file);
    setBlobUrl(objectUrl);
    setDocReady(true);
  };

  const resetSession = () => {
    setDocReady(false);
    setViewerOpen(false);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-glyph">NX</div>
          <h1>NEUROLEX <span>v2.0</span></h1>
        </div>

        <div className="system-status">
          <div
            className="pulse-indicator"
            style={{ color: docReady ? 'var(--neon-cyan)' : 'var(--danger)', background: docReady ? 'var(--neon-cyan)' : 'var(--danger)' }}
          />
          <span>{docReady ? 'Neural Link Active' : 'Awaiting Corpus'}</span>
          {docReady && (
            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.75rem' }}>
              <button
                onClick={() => setViewerOpen(!viewerOpen)}
                className={`action-chip ${viewerOpen ? 'active' : ''}`}
              >
                {viewerOpen ? 'Hide Doc' : 'View Doc'}
              </button>
              <button onClick={resetSession} className="action-chip">
                Purge
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={`workspace ${viewerOpen ? 'dual-pane' : ''}`}>
        {!docReady ? (
          <IngestUpload onUploadSuccess={(data, file) => onDocIngested(file)} />
        ) : (
          <>
            <NeuralChat onCitationClick={(page) => {
              setTargetPage(page);
              setViewerOpen(true);
            }} />
            {viewerOpen && (
              <div className="doc-viewer-pane">
                <DocViewer url={blobUrl} currentPage={targetPage} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bottom-bar">
        Neurolex Protocol v2.0 &bull; RAG Pipeline &bull; ChromaDB + HuggingFace
      </footer>
    </div>
  );
}

export default App;
