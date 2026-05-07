import { readFileSync } from 'fs';
import path from 'path';

export class NeuralChatService {
    constructor(vectorIndex, llmGateway, conversationStore) {
        this.vectorIndex = vectorIndex;
        this.llm = llmGateway;
        this.conversationStore = conversationStore;
        this.relevanceThreshold = 0.88;

        const policyFile = path.join(process.cwd(), 'src/config/llm_policy.md');
        this.systemPolicy = readFileSync(policyFile, 'utf8');
    }

    async answerQuery(query) {
        let candidates = await this.vectorIndex.search(query, 10);

        const queryTokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
        candidates = candidates.map(c => {
            let overlap = 0;
            const lowerText = c.text.toLowerCase();
            for (const token of queryTokens) {
                if (lowerText.includes(token)) overlap++;
            }
            c.combinedScore = (1 - c.distance) + (overlap * 0.1);
            return c;
        });

        candidates.sort((a, b) => b.combinedScore - a.combinedScore);
        candidates = candidates.slice(0, 3);
        const topHit = candidates[0];

        console.log(`[Chat] Query: "${query}" | Top distance: ${topHit?.distance} | Threshold: ${this.relevanceThreshold}`);

        let result;
        if (!topHit || topHit.distance > this.relevanceThreshold) {
            const declinePrompt = `The user asked something not covered by the document. Politely decline, stating the information is not in the provided PDF. Respond in the same language as the user's query.`;
            const answer = await this.llm.complete([
                { role: 'system', content: declinePrompt },
                { role: 'user', content: query }
            ]);
            result = { answer, grounded: false };
        } else {
            const systemMsg = this._assemblePrompt(query, candidates);
            const answer = await this.llm.complete([
                { role: 'system', content: systemMsg },
                { role: 'user', content: query }
            ]);
            result = { answer, grounded: true, citations: candidates.map(c => c.metadata.page) };
        }

        await this.conversationStore.persist({
            query,
            response: result.answer,
            grounded: result.grounded,
            citations: result.citations || []
        });

        return result;
    }

    async streamAnswer(query) {
        const raw = await this.vectorIndex.search(query, 10);

        const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 3);
        const ranked = raw
            .filter(r => r.text.length > 50)
            .map(r => {
                let score = r.distance;
                const lower = r.text.toLowerCase();
                if (keywords.some(kw => lower.includes(kw))) {
                    score *= 0.6;
                }
                return { ...r, rankScore: score };
            })
            .sort((a, b) => a.rankScore - b.rankScore);

        const topResult = ranked[0];
        const threshold = 0.88;

        console.log(`[Chat] Stream query: "${query}" | Rank score: ${topResult?.rankScore?.toFixed(3)}`);

        if (!topResult || topResult.rankScore > threshold) {
            const refusal = `You are a document-grounded assistant. The user's query is NOT covered by the uploaded PDF. Politely refuse, explaining the info is not available. Use the same language as the query. Do NOT echo the query.`;
            const stream = await this.llm.completeStream([
                { role: 'system', content: refusal },
                { role: 'user', content: `User query: "${query}"` }
            ]);

            return {
                stream: this._collectAndPersist(query, stream, [], false),
                citations: []
            };
        }

        const context = ranked.slice(0, 5);
        const history = await this.conversationStore.getHistory(4);
        const stream = await this.llm.completeStream([
            { role: 'system', content: this._assemblePrompt(query, context) },
            ...history.reverse().map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: query }
        ]);

        return {
            stream: this._collectAndPersist(query, stream, context, true),
            citations: context.map(c => ({ page: c.metadata.page, text: c.text }))
        };
    }

    async *_collectAndPersist(query, stream, citations, grounded) {
        let fullText = '';
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) fullText += delta;
            yield chunk;
        }

        await this.conversationStore.persist({
            query,
            response: fullText,
            grounded,
            citations
        });
    }

    _assemblePrompt(query, contexts) {
        const contextBlock = contexts
            .map(c => `[Page ${c.metadata.page}]: ${c.text}`)
            .join('\n\n');

        return `${this.systemPolicy}\n\n## Current Task\nAnswer the following query using only the provided context.\nQuery: ${query}\n\n## Context\n${contextBlock}`;
    }
}
