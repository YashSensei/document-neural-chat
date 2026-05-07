import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';

const NeuralChat = ({ onCitationClick }) => {
    const { messages, loading, sendMessage } = useChat();
    const [input, setInput] = useState('');
    const scrollAnchor = useRef(null);

    useEffect(() => {
        scrollAnchor.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const transmit = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const extractPageRefs = (text) => {
        const matches = text.match(/\[(?:Page )?(\d+)\]/g) || [];
        return [...new Set(matches)].map(m => m.match(/\d+/)[0]);
    };

    const renderContent = (msg, idx) => {
        const isNeural = msg.role === 'ai';
        const isThinking = isNeural && loading && idx === messages.length - 1 && !msg.content;

        if (isThinking) {
            return (
                <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} className="pulse-indicator" style={{
                            background: 'var(--neon-cyan)',
                            color: 'var(--neon-cyan)',
                            width: '5px',
                            height: '5px',
                            animationDelay: `${i * 0.15}s`
                        }} />
                    ))}
                </div>
            );
        }

        const content = msg.content || '';
        const pages = isNeural ? extractPageRefs(content) : [];

        return (
            <div>
                {pages.length > 0 && (
                    <div className="ref-section">
                        <div className="ref-label">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                            Grounded Sources
                        </div>
                        <div className="ref-list">
                            {pages.map((pg, i) => (
                                <div key={i} className="ref-chip" onClick={() => onCitationClick?.(parseInt(pg))}>
                                    <span className="ref-chip-idx">{pg}</span>
                                    Page {pg}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <ReactMarkdown
                    components={{
                        p: ({ children }) => {
                            if (typeof children === 'string' || (Array.isArray(children) && children.every(c => typeof c === 'string'))) {
                                const raw = Array.isArray(children) ? children.join('') : children;
                                const segments = raw.split(/(\[(?:Page )?\d+\])/g);
                                return (
                                    <p>
                                        {segments.map((seg, i) => {
                                            const pageMatch = seg.match(/\[(?:Page )?(\d+)\]/);
                                            if (pageMatch) {
                                                return (
                                                    <span
                                                        key={i}
                                                        className="inline-ref"
                                                        onClick={() => onCitationClick?.(parseInt(pageMatch[1]))}
                                                        title={`Source: Page ${pageMatch[1]}`}
                                                    >
                                                        {pageMatch[1]}
                                                    </span>
                                                );
                                            }
                                            return seg;
                                        })}
                                    </p>
                                );
                            }
                            return <p>{children}</p>;
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="neural-chat">
            <div className="thread-feed">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`thread-entry ${msg.role === 'ai' ? 'neural' : ''}`}>
                        <div className="entry-layout">
                            <div className={`sender-badge ${msg.role === 'ai' ? 'neural' : 'human'}`}>
                                {msg.role === 'user' ? 'YOU' : 'NX'}
                            </div>
                            <div className="entry-body">
                                {renderContent(msg, idx)}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={scrollAnchor} />
            </div>

            <div className="prompt-dock">
                <div className="prompt-field">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && transmit()}
                        placeholder="Query the neural corpus..."
                        disabled={loading}
                    />
                    <button className="transmit-btn" onClick={transmit} disabled={loading || !input.trim()}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NeuralChat;
