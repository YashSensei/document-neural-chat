export class NeuralEmbedder {
    constructor() {
        this.apiUrl = 'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2';
        this.token = process.env.HF_TOKEN;
    }

    async embed(textArray) {
        const results = [];
        const batchSize = 10;

        for (let i = 0; i < textArray.length; i += batchSize) {
            const batch = textArray.slice(i, i + batchSize);
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: batch })
            });

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
