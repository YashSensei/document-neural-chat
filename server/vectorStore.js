import { ChromaClient } from 'chromadb';
import { generateEmbeddings } from './llmService.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new ChromaClient({
    path: process.env.CHROMA_URL || "http://localhost:8000"
});

const COLLECTION_NAME = "pdf_collection";

/**
 * Initializes the collection (resets if exists for clean state per upload)
 */
export const initCollection = async () => {
    try {
        await client.deleteCollection({ name: COLLECTION_NAME });
    } catch (e) {
        // Ignore if collection doesn't exist
    }
    return await client.createCollection({ 
        name: COLLECTION_NAME,
        embeddingFunction: { generate: async () => [] } 
    });
};

/**
 * Adds chunks to the vector store.
 * @param {Array<{text: string, page: number, chunkIndex: number}>} chunks 
 */
export const addChunks = async (chunks) => {
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    
    const ids = chunks.map((_, i) => `chunk_${i}`);
    const texts = chunks.map(c => c.text);
    const metadatas = chunks.map(c => ({ page: c.page }));
    
    const embeddings = await generateEmbeddings(texts);
    
    await collection.add({
        ids,
        embeddings,
        metadatas,
        documents: texts
    });
};

/**
 * Queries the vector store for relevant chunks.
 * @param {string} query 
 * @param {number} nResults 
 * @returns {Promise<Array<{text: string, page: number, distance: number}>>}
 */
export const queryStore = async (query, nResults = 3) => {
    const collection = await client.getCollection({ name: COLLECTION_NAME });
    const queryEmbedding = await generateEmbeddings([query]);
    
    const results = await collection.query({
        queryEmbeddings: queryEmbedding,
        nResults: nResults,
    });

    const formattedResults = [];
    if (results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
            formattedResults.push({
                text: results.documents[0][i],
                page: results.metadatas[0][i].page,
                distance: results.distances[0][i]
            });
        }
    }
    
    return formattedResults;
};
