import { queryStore } from './vectorStore.js';
import { getGroundedResponse } from './llmService.js';
import fs from 'fs';

async function runTests() {
    const queries = JSON.parse(fs.readFileSync('../test-queries.json', 'utf8'));
    
    console.log("=== RUNNING GROUNDING VERIFICATION ===\n");

    for (const query of queries.valid_queries) {
        console.log(`[VALID] Query: ${query}`);
        const context = await queryStore(query);
        const bestDistance = context.length > 0 ? context[0].distance : 2.0;
        console.log(`Best Distance: ${bestDistance}`);
        if (bestDistance <= 1.5) {
            const answer = await getGroundedResponse(query, context);
            console.log(`Answer: ${answer.substring(0, 100)}...`);
        } else {
            console.log("Refused (as expected if no doc uploaded yet)");
        }
        console.log("---");
    }

    for (const query of queries.invalid_queries) {
        console.log(`[INVALID] Query: ${query}`);
        const context = await queryStore(query);
        const bestDistance = context.length > 0 ? context[0].distance : 2.0;
        console.log(`Best Distance: ${bestDistance}`);
        if (bestDistance > 1.5) {
            console.log("Refused (Correct Grounding)");
        } else {
            console.log("Accepted (Possible Hallucination or Context Match)");
        }
        console.log("---");
    }
}

runTests().catch(console.error);
