import OpenAI from 'openai';

export class NeuralEmbedder {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.HF_TOKEN,
            baseURL: 'https://router.huggingface.co/v1',
        });
        this.model = 'sentence-transformers/all-MiniLM-L6-v2';
    }

    async embed(textArray) {
        const results = [];
        const batchSize = 10;

        for (let i = 0; i < textArray.length; i += batchSize) {
            const batch = textArray.slice(i, i + batchSize);
            const response = await this.client.embeddings.create({
                model: this.model,
                input: batch,
            });
            for (const item of response.data) {
                results.push(item.embedding);
            }
        }

        return results;
    }
}
