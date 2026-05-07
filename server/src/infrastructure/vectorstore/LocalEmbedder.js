export class NeuralEmbedder {
    constructor() {
        this.apiUrl = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
        this.token = process.env.HF_TOKEN;
    }

    async embed(textArray) {
        const results = [];
        const batchSize = 10;

        for (let i = 0; i < textArray.length; i += batchSize) {
            const batch = textArray.slice(i, i + batchSize);

            let response;
            for (let attempt = 0; attempt < 3; attempt++) {
                response = await fetch(this.apiUrl, {
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
                    await new Promise(r => setTimeout(r, 3000));
                } else {
                    break;
                }
            }

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Embedding API error ${response.status}: ${errText}`);
            }

            const embeddings = await response.json();
            for (const emb of embeddings) {
                results.push(emb);
            }
        }

        return results;
    }
}
