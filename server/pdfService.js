import { PDFParse } from 'pdf-parse';

/**
 * Extracts text from a PDF buffer page by page.
 * @param {Buffer} dataBuffer 
 * @returns {Promise<Array<{text: string, page: number}>>}
 */
export const parsePdfByPage = async (dataBuffer) => {
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    
    // Convert result.pages ({text, num}) to our format ({text, page})
    return result.pages.map(p => ({
        text: p.text,
        page: p.num
    }));
};

/**
 * Chunks text from pages with overlap.
 * @param {Array<{text: string, page: number}>} pages 
 * @param {number} chunkSize 
 * @param {number} chunkOverlap 
 * @returns {Array<{text: string, page: number, chunkIndex: number}>}
 */
export const chunkPages = (pages, chunkSize = 1000, chunkOverlap = 200) => {
    const chunks = [];
    
    for (const page of pages) {
        const text = page.text;
        if (text.length <= chunkSize) {
            chunks.push({
                text: text,
                page: page.page,
                chunkIndex: 0
            });
            continue;
        }

        let start = 0;
        let index = 0;
        while (start < text.length) {
            let end = start + chunkSize;
            const chunkText = text.substring(start, end);
            chunks.push({
                text: chunkText,
                page: page.page,
                chunkIndex: index++
            });
            start += (chunkSize - chunkOverlap);
        }
    }
    
    return chunks;
};
