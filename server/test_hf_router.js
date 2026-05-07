import OpenAI from "openai";
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN,
});

async function main() {
    const model = process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct";
    console.log(`Testing with model: ${model}`);
    
    try {
        const response = await client.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: "Say hello!" }],
            max_tokens: 10,
        });

        console.log("Chat Response:", response.choices[0].message.content);
        
        console.log("\nTesting Embeddings...");
        const embedResponse = await client.embeddings.create({
            model: process.env.EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2",
            input: ["This is a test."],
        });
        
        console.log(`Embedding Success! Dimensions: ${embedResponse.data[0].embedding.length}`);
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Status:", e.status);
            // console.error("Body:", await e.response.text());
        }
    }
}

main();
