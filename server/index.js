import express from 'express';
import cors from 'cors';
import routes from './src/api/routes/index.js';

const server = express();
const PORT = process.env.PORT || 5000;

server.use(cors());
server.use(express.json());
server.use('/', routes);

server.listen(PORT, () => {
    console.log(`[NEUROLEX] Backend active on port ${PORT}`);
});
