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
                console.log(`[NeuralEmbedder] Embedding batch, attempt ${attempt + 1}, token: ${this.token ? 'SET' : 'MISSING'}`);
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

            const embeddings = await response.json();
            for (const emb of embeddings) {
                results.push(emb);
            }
        }

        return results;
    }
}
