import { pipeline } from '@xenova/transformers';

export class NeuralEmbedder {
    constructor(modelId = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2') {
        this.modelId = modelId;
        this.extractor = null;
    }

    async embed(textArray) {
        if (!this.extractor) {
            console.log('[NeuralEmbedder] Loading transformer model...');
            this.extractor = await pipeline('feature-extraction', this.modelId);
        }

        const vectors = [];
        for (const text of textArray) {
            const output = await this.extractor(text, { pooling: 'mean', normalize: true });
            vectors.push(Array.from(output.data));
        }
        return vectors;
    }
}
