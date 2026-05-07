import { ChromaClient } from 'chromadb';

export class VectorIndex {
    constructor(opts) {
        this.client = new ChromaClient({ path: opts.url || 'http://localhost:8000' });
        this.namespace = 'neurolex_docs';
        this.embedder = opts.embedder;
    }

    async purge() {
        try {
            await this.client.deleteCollection({ name: this.namespace });
        } catch (_) {}
        return await this.client.createCollection({
            name: this.namespace,
            embeddingFunction: { generate: async () => [] },
            metadata: { 'hnsw:space': 'cosine' }
        });
    }

    async store(texts, metadataList) {
        const collection = await this.client.getCollection({ name: this.namespace });
        const chunkSize = 50;

        for (let offset = 0; offset < texts.length; offset += chunkSize) {
            const textBatch = texts.slice(offset, offset + chunkSize);
            const metaBatch = metadataList.slice(offset, offset + chunkSize);
            const ids = textBatch.map((_, j) => `vec_${Date.now()}_${offset + j}`);

            const embeddings = await this.embedder.embed(textBatch);

            await collection.add({
                ids,
                embeddings,
                metadatas: metaBatch,
                documents: textBatch
            });
            console.log(`[VectorIndex] Stored batch ${Math.floor(offset / chunkSize) + 1}/${Math.ceil(texts.length / chunkSize)}`);
        }
    }

    async search(queryText, topK = 3) {
        const collection = await this.client.getCollection({ name: this.namespace });
        const queryVec = await this.embedder.embed([queryText]);

        const hits = await collection.query({
            queryEmbeddings: queryVec,
            nResults: topK,
        });

        return this._normalize(hits);
    }

    _normalize(raw) {
        const output = [];
        if (raw.documents[0]) {
            for (let i = 0; i < raw.documents[0].length; i++) {
                output.push({
                    text: raw.documents[0][i],
                    metadata: raw.metadatas[0][i],
                    distance: raw.distances[0][i]
                });
            }
        }
        return output;
    }
}
