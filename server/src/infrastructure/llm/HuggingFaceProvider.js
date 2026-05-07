import OpenAI from 'openai';

export class LLMGateway {
    constructor(config) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL || 'https://router.huggingface.co/v1',
        });
        this.modelId = config.model || 'Qwen/Qwen2.5-7B-Instruct';
    }

    async complete(messages, opts = {}) {
        let lastErr;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const resp = await this.client.chat.completions.create({
                    model: this.modelId,
                    messages,
                    temperature: opts.temperature ?? 0,
                    max_tokens: opts.maxTokens ?? 1000,
                });
                return resp.choices[0].message.content;
            } catch (err) {
                lastErr = err;
                console.warn(`[LLMGateway] Attempt ${attempt + 1} failed: ${err.message}`);
                await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
            }
        }
        throw lastErr;
    }

    async completeStream(messages, opts = {}) {
        let lastErr;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                return await this.client.chat.completions.create({
                    model: this.modelId,
                    messages,
                    temperature: opts.temperature ?? 0,
                    max_tokens: opts.maxTokens ?? 1000,
                    stream: true,
                });
            } catch (err) {
                lastErr = err;
                console.warn(`[LLMGateway] Stream attempt ${attempt + 1} failed: ${err.message}`);
                await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
            }
        }
        throw lastErr;
    }
}
