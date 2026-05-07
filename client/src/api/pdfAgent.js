const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const neurolexApi = {
    async ingestDocument(file) {
        const payload = new FormData();
        payload.append('pdf', file);

        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: payload,
        });

        if (!res.ok) throw new Error('Document ingestion failed');
        return res.json();
    },

    async *streamQuery(query) {
        const res = await fetch(`${API_BASE}/chat-stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!res.ok) throw new Error('Neural stream connection failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const payload = line.slice(6);
                    if (payload === '[DONE]') return;
                    yield JSON.parse(payload);
                }
            }
        }
    }
};
