export class CorpusIngestionService {
    constructor(extractor, vectorIndex) {
        this.extractor = extractor;
        this.vectorIndex = vectorIndex;
    }

    async processDocument(buffer) {
        console.log('[Ingestion] Starting document processing...');
        const pages = await this.extractor.extractPages(buffer);

        await this.vectorIndex.purge();

        const initialPages = pages.slice(0, 3);
        const initialSegments = this.extractor.segmentIntoChunks(initialPages);

        if (initialSegments.length > 0) {
            await this.vectorIndex.store(
                initialSegments.map(s => s.text),
                initialSegments.map(s => ({ page: s.page, section: s.section || 'General' }))
            );
        }

        if (pages.length > 3) {
            setTimeout(async () => {
                try {
                    console.log('[Ingestion] Background vectorization in progress...');
                    const remaining = pages.slice(3);
                    const remainingSegments = this.extractor.segmentIntoChunks(remaining);
                    await this.vectorIndex.store(
                        remainingSegments.map(s => s.text),
                        remainingSegments.map(s => ({ page: s.page, section: s.section || 'General' }))
                    );
                    console.log('[Ingestion] Background vectorization complete.');
                } catch (e) {
                    console.error('[Ingestion] Background processing failed:', e);
                }
            }, 100);
        }

        return { pages: pages.length, chunksIndexed: initialSegments.length };
    }
}
