import express from 'express';
import multer from 'multer';
import * as IngestionController from '../controllers/IngestionController.js';
import * as ChatController from '../controllers/ChatController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('pdf'), IngestionController.uploadPdf);
router.post('/chat', ChatController.chat);
router.post('/chat-stream', ChatController.chatStream);
router.get('/history', ChatController.getHistory);

export default router;
