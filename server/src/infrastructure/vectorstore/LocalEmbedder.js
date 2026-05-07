const EMBEDDING_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';

export class NeuralEmbedder {
    constructor() {
        this.token = process.env.HF_TOKEN;
    }

    async embed(textArray) {
        const results = [];
        const batchSize = 8;

        for (let i = 0; i < textArray.length; i += batchSize) {
            const batch = textArray.slice(i, i + batchSize);

            let response;
            for (let attempt = 0; attempt < 3; attempt++) {
                response = await fetch(EMBEDDING_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ inputs: batch, options: { wait_for_model: true } })
                });

                if (response.ok) break;
                if (response.status === 503) {
                    await new Promise(r => setTimeout(r, 5000));
                } else {
                    break;
                }
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Embedding failed: ${response.status} - ${errText.substring(0, 100)}`);
            }

            const raw = await response.json();

            for (const item of raw) {
                const vec = this._toFlat384(item);
                results.push(vec);
            }
        }

        return results;
    }

    _toFlat384(item) {
        if (!Array.isArray(item)) return [];

        // Already a flat vector [0.1, 0.2, ...]
        if (typeof item[0] === 'number') return item;

        // Token-level embeddings [[0.1, ...], [0.2, ...], ...] — mean pool
        if (Array.isArray(item[0]) && typeof item[0][0] === 'number') {
            const dim = item[0].length;
            const pooled = new Array(dim).fill(0);
            for (const row of item) {
                for (let d = 0; d < dim; d++) {
                    pooled[d] += row[d];
                }
            }
            for (let d = 0; d < dim; d++) {
                pooled[d] /= item.length;
            }
            return pooled;
        }

        return [];
    }
}
