import React, { useRef } from 'react';
import { useUpload } from '../hooks/useUpload';

const IngestUpload = ({ onUploadSuccess }) => {
    const { file, status, progress, error, selectFile, upload } = useUpload(onUploadSuccess);
    const inputRef = useRef(null);

    const handlePick = (e) => {
        selectFile(e.target.files[0]);
    };

    const statusLabel = () => {
        if (status === 'uploading') return 'Parsing Neural Vectors...';
        if (status === 'ready') return 'Corpus Linked!';
        return 'Processing...';
    };

    return (
        <div className="ingest-zone">
            <div className="ingest-panel">
                <div style={{ marginBottom: '2rem' }}>
                    <h2>Upload Corpus</h2>
                    <p>Feed a PDF document to initialize the neural retrieval engine.</p>
                </div>

                <div
                    className={`file-drop ${file ? 'has-file' : ''}`}
                    onClick={() => inputRef.current.click()}
                >
                    <input
                        type="file"
                        ref={inputRef}
                        accept=".pdf"
                        onChange={handlePick}
                        style={{ display: 'none' }}
                    />

                    <div className="upload-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>

                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.3rem', color: file ? 'var(--neon-magenta)' : 'var(--text-bright)' }}>
                            {file ? file.name : 'Select Document'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF format — max 10MB'}
                        </div>
                    </div>
                </div>

                {status !== 'idle' ? (
                    <div style={{ marginTop: '2rem' }}>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span style={{ color: 'var(--neon-cyan)' }}>{statusLabel()}</span>
                            <span style={{ color: 'var(--text-dim)' }}>{progress}%</span>
                        </div>
                    </div>
                ) : (
                    <button
                        className="ingest-btn"
                        onClick={upload}
                        disabled={!file}
                    >
                        Initialize Neural Link
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                )}

                {error && (
                    <div style={{
                        marginTop: '1.25rem',
                        padding: '0.75rem',
                        background: 'rgba(255, 51, 102, 0.08)',
                        border: '1px solid rgba(255, 51, 102, 0.25)',
                        borderRadius: '8px',
                        color: 'var(--danger)',
                        fontSize: '0.8rem'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IngestUpload;
