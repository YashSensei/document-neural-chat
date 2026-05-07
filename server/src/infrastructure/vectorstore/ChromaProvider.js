import { Pinecone } from '@pinecone-database/pinecone';

export class VectorIndex {
    constructor(opts) {
        this.pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        this.indexName = process.env.PINECONE_INDEX || 'neurolex';
        this.embedder = opts.embedder;
        this.namespace = 'default';
    }

    async purge() {
        const index = this.pc.index(this.indexName);
        try {
            await index.namespace(this.namespace).deleteAll();
        } catch (_) {}
    }

    async store(texts, metadataList) {
        const index = this.pc.index(this.indexName);
        const batchSize = 50;

        const validTexts = [];
        const validMeta = [];
        for (let i = 0; i < texts.length; i++) {
            if (texts[i] && texts[i].trim().length > 0) {
                validTexts.push(texts[i]);
                validMeta.push(metadataList[i]);
            }
        }

        if (validTexts.length === 0) return;

        for (let offset = 0; offset < validTexts.length; offset += batchSize) {
            const textBatch = validTexts.slice(offset, offset + batchSize);
            const metaBatch = validMeta.slice(offset, offset + batchSize);

            const embeddings = await this.embedder.embed(textBatch);

            console.log(`[VectorIndex] Embeddings count: ${embeddings.length}, first dim: ${embeddings[0]?.length}`);

            const vectors = textBatch
                .map((text, j) => ({
                    id: `vec_${Date.now()}_${offset + j}_${Math.random().toString(36).slice(2, 8)}`,
                    values: embeddings[j],
                    metadata: { ...metaBatch[j], text: text.substring(0, 500) }
                }))
                .filter(v => Array.isArray(v.values) && v.values.length > 0 && typeof v.values[0] === 'number');

            console.log(`[VectorIndex] Vectors to upsert: ${vectors.length}`);
            if (vectors.length === 0) continue;

            await index.namespace(this.namespace).upsert(vectors);
            console.log(`[VectorIndex] Stored batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(validTexts.length / batchSize)}`);
        }
    }

    async search(queryText, topK = 3) {
        const index = this.pc.index(this.indexName);
        const queryVec = await this.embedder.embed([queryText]);

        const results = await index.namespace(this.namespace).query({
            vector: queryVec[0],
            topK,
            includeMetadata: true
        });

        return results.matches.map(match => ({
            text: match.metadata.text,
            metadata: { page: match.metadata.page, section: match.metadata.section },
            distance: 1 - match.score
        }));
    }
}
