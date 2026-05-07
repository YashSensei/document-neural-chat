import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.HF_TOKEN;
console.log(`Testing with token: ${token ? token.substring(0, 5) + '...' : 'UNDEFINED'}`);

const client = new OpenAI({
    apiKey: token,
    baseURL: "https://router.huggingface.co/v1",
});

async function test() {
    try {
        console.log("Sending request to Hugging Face...");
        const response = await client.chat.completions.create({
            model: process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct",
            messages: [{ role: "user", content: "Hello, are you working?" }],
            max_tokens: 50,
        });
        console.log("SUCCESS! Received response:");
        console.log(response.choices[0].message.content);
    } catch (error) {
        console.error("FAILED! Error details:");
        console.error(error.message);
    }
}

test();
