import { chatService } from '../../config/container.js';

export const chat = async (req, res) => {
    try {
        const { query } = req.body;
        const result = await chatService.answerQuery(query);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const chatStream = async (req, res) => {
    try {
        const { query } = req.body;
        const result = await chatService.streamAnswer(query);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');

        if (!result) {
            res.write(`data: ${JSON.stringify({ content: 'Unable to locate relevant information in the document.', grounded: false })}\n\n`);
            return res.end();
        }

        for await (const chunk of result.stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                res.write(`data: ${JSON.stringify({ content, grounded: true })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err) {
        console.error('[Stream]', err);
        res.status(500).end();
    }
};

export const getHistory = async (req, res) => {
    try {
        const history = await chatService.conversationStore.getHistory();
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
