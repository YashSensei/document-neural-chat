import { ingestionService } from '../../config/container.js';

export const uploadPdf = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No document provided' });

        const result = await ingestionService.processDocument(req.file.buffer);
        res.json({ status: 'indexed', ...result });
    } catch (err) {
        console.error('[Upload]', err);
        res.status(500).json({ error: err.message });
    }
};
