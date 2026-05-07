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

        for (let offset = 0; offset < texts.length; offset += batchSize) {
            const textBatch = texts.slice(offset, offset + batchSize);
            const metaBatch = metadataList.slice(offset, offset + batchSize);

            const embeddings = await this.embedder.embed(textBatch);

            const vectors = textBatch.map((text, j) => ({
                id: `vec_${Date.now()}_${offset + j}`,
                values: embeddings[j],
                metadata: { ...metaBatch[j], text }
            }));

            await index.namespace(this.namespace).upsert(vectors);
            console.log(`[VectorIndex] Stored batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
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
