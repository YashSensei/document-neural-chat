import { LLMGateway } from '../infrastructure/llm/HuggingFaceProvider.js';
import { VectorIndex } from '../infrastructure/vectorstore/ChromaProvider.js';
import { NeuralEmbedder } from '../infrastructure/vectorstore/LocalEmbedder.js';
import { DocumentExtractor } from '../infrastructure/pdf/PdfParser.js';
import { NeuralChatService } from '../core/services/ChatService.js';
import { CorpusIngestionService } from '../core/services/IngestionService.js';
import { ConversationStore } from '../infrastructure/database/InMemoryMessageRepository.js';
import dotenv from 'dotenv';

dotenv.config();

const embedder = new NeuralEmbedder();
const vectorIndex = new VectorIndex({ embedder });

const llmGateway = new LLMGateway({
    apiKey: process.env.HF_TOKEN,
    model: process.env.HF_MODEL
});

const extractor = new DocumentExtractor();
const conversationStore = new ConversationStore();

export const ingestionService = new CorpusIngestionService(extractor, vectorIndex);
export const chatService = new NeuralChatService(vectorIndex, llmGateway, conversationStore);
