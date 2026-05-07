import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.HF_TOKEN,
    baseURL: "https://router.huggingface.co/v1",
});

/**
 * Generates a grounded response based on context.
 * @param {string} query 
 * @param {Array<{text: string, page: number}>} contextChunks 
 * @returns {Promise<string>}
 */
export const getGroundedResponse = async (query, contextChunks) => {
    if (!contextChunks || contextChunks.length === 0) {
        return "I'm sorry, but I cannot find information regarding this in the provided document.";
    }

    const contextText = contextChunks
        .map(c => `[Page ${c.page}]: ${c.text}`)
        .join('\n\n');

    const systemPrompt = `You are a PDF-Constrained Conversational Agent.
Your goal is to answer the user's question ONLY using the provided context.
- If the answer is not in the context, say "I'm sorry, but I cannot find information regarding this in the provided document."
- Always provide page-level citations like [Page X] for every claim you make.
- Do NOT use outside knowledge.
- Be concise and accurate.

Context:
${contextText}`;

    try {
        const response = await client.chat.completions.create({
            model: process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query }
            ],
            temperature: 0, // Strict grounding
            max_tokens: 1000,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("LLM Service Error:", error);
        throw error;
    }
};

/**
 * Generates a streaming grounded response.
 * @param {string} query 
 * @param {Array<{text: string, page: number}>} contextChunks 
 * @returns {Promise<AsyncIterable<any>>}
 */
export const getGroundedResponseStream = async (query, contextChunks) => {
    const contextText = contextChunks
        .map(c => `[Page ${c.page}]: ${c.text}`)
        .join('\n\n');

    const systemPrompt = `You are a PDF-Constrained Conversational Agent.
Your goal is to answer the user's question ONLY using the provided context.
- If the answer is not in the context, say "I'm sorry, but I cannot find information regarding this in the provided document."
- Always provide page-level citations like [Page X] for every claim you make.
- Do NOT use outside knowledge.
- Be concise and accurate.

Context:
${contextText}`;

    return client.chat.completions.create({
        model: process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
        ],
        temperature: 0,
        max_tokens: 1000,
        stream: true,
    });
};

import { pipeline } from '@xenova/transformers';

let embedder = null;

/**
 * Generates embeddings locally using transformers.js.
 * @param {string[]} texts 
 * @returns {Promise<number[][]>}
 */
export const generateEmbeddings = async (texts) => {
    try {
        if (!embedder) {
            console.log("Loading local embedding model...");
            embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        const results = [];
        for (const text of texts) {
            const output = await embedder(text, { pooling: 'mean', normalize: true });
            results.push(Array.from(output.data));
        }
        return results;
    } catch (error) {
        console.error("Local Embedding Error:", error);
        throw error;
    }
};
