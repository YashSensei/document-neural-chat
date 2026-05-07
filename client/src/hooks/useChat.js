import { useState } from 'react';
import { neurolexApi } from '../api/pdfAgent';

export const useChat = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Neural link established. All responses are strictly grounded to your uploaded corpus. Ask me anything.', grounded: true }
    ]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (query) => {
        if (!query.trim() || loading) return;

        const userEntry = { role: 'user', content: query };
        const aiPlaceholder = { role: 'ai', content: '', grounded: true };

        setMessages(prev => [...prev, userEntry, aiPlaceholder]);
        setLoading(true);

        try {
            let accumulated = '';
            for await (const chunk of neurolexApi.streamQuery(query)) {
                accumulated += chunk.content;
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: 'ai',
                        content: accumulated,
                        grounded: chunk.grounded
                    };
                    return updated;
                });
            }
        } catch (err) {
            console.error('Stream error:', err);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'ai', content: 'Connection to neural backend lost.', grounded: false };
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    return { messages, loading, sendMessage };
};
