const EMBEDDING_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction';

export class NeuralEmbedder {
    constructor() {
        this.token = process.env.HF_TOKEN;
    }

    async embed(textArray) {
        const results = [];
        const batchSize = 10;

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
                    console.log('[NeuralEmbedder] Model loading, retrying...');
                    await new Promise(r => setTimeout(r, 5000));
                } else {
                    break;
                }
            }

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[NeuralEmbedder] Failed: ${response.status} — ${errText.substring(0, 200)}`);
                throw new Error(`Embedding failed: ${response.status}`);
            }

            const raw = await response.json();
            console.log(`[NeuralEmbedder] Response shape: ${Array.isArray(raw) ? raw.length : typeof raw}, first item type: ${Array.isArray(raw[0]) ? (Array.isArray(raw[0][0]) ? '3D' : '2D') : typeof raw[0]}`);

            for (const item of raw) {
                if (Array.isArray(item) && Array.isArray(item[0])) {
                    // 3D: token-level embeddings — mean pool to get sentence embedding
                    const dim = item[0].length;
                    const pooled = new Array(dim).fill(0);
                    for (const tokenVec of item) {
                        for (let d = 0; d < dim; d++) {
                            pooled[d] += tokenVec[d];
                        }
                    }
                    for (let d = 0; d < dim; d++) {
                        pooled[d] /= item.length;
                    }
                    results.push(pooled);
                } else if (Array.isArray(item) && typeof item[0] === 'number') {
                    // 2D: already a sentence embedding
                    results.push(item);
                } else {
                    console.error('[NeuralEmbedder] Unexpected embedding format:', typeof item);
                    results.push([]);
                }
            }
        }

        return results;
    }
}
