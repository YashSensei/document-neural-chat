import { Pinecone } from '@pinecone-database/pinecone';

export class VectorIndex {
    constructor(opts) {
        this.pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        this.indexName = process.env.PINECONE_INDEX || 'neurolex';
        this.embedder = opts.embedder;
        this.ns = 'default';
    }

    async purge() {
        try {
            const index = this.pc.index(this.indexName);
            await index.namespace(this.ns).deleteAll();
        } catch (_) {}
    }

    async store(texts, metadataList) {
        const index = this.pc.index(this.indexName);

        const validTexts = [];
        const validMeta = [];
        for (let i = 0; i < texts.length; i++) {
            if (texts[i] && texts[i].trim().length > 0) {
                validTexts.push(texts[i]);
                validMeta.push(metadataList[i]);
            }
        }

        if (validTexts.length === 0) return;

        const allEmbeddings = await this.embedder.embed(validTexts);

        const records = [];
        for (let i = 0; i < validTexts.length; i++) {
            if (Array.isArray(allEmbeddings[i]) && allEmbeddings[i].length === 384) {
                records.push({
                    id: `v${Date.now()}${i}${Math.random().toString(36).slice(2, 6)}`,
                    values: allEmbeddings[i],
                    metadata: {
                        page: validMeta[i].page || 1,
                        section: validMeta[i].section || 'General',
                        text: validTexts[i].substring(0, 500)
                    }
                });
            }
        }

        if (records.length === 0) return;

        const batchSize = 50;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            await index.namespace(this.ns).upsert({ records: batch });
            console.log(`[VectorIndex] Upserted ${batch.length} vectors`);
        }
    }

    async search(queryText, topK = 3) {
        const index = this.pc.index(this.indexName);
        const queryVec = await this.embedder.embed([queryText]);

        const results = await index.namespace(this.ns).query({
            vector: queryVec[0],
            topK,
            includeMetadata: true
        });

        return (results.matches || []).map(match => ({
            text: match.metadata.text,
            metadata: { page: match.metadata.page, section: match.metadata.section },
            distance: 1 - match.score
        }));
    }
}
