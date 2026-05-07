import { PDFParse } from 'pdf-parse';

export class DocumentExtractor {
    async extractPages(buffer) {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();

        return result.pages.map(p => ({
            text: p.text,
            page: p.num
        }));
    }

    segmentIntoChunks(pages, maxSize = 1000, overlapSize = 200) {
        const segments = [];
        let activeSection = 'General';

        for (const page of pages) {
            const lines = page.text.split('\n');
            let accumulated = '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length > 3 && trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
                    activeSection = trimmed;
                }
                accumulated += line + '\n';
            }

            const pageChunks = this._splitRecursively(accumulated, maxSize, overlapSize);
            for (const chunk of pageChunks) {
                if (chunk.trim()) {
                    segments.push({
                        text: chunk.trim(),
                        page: page.page,
                        section: activeSection
                    });
                }
            }
        }

        return segments;
    }

    _splitRecursively(content, maxLen, overlap) {
        if (content.length <= maxLen) return [content];

        const delimiters = ['\n\n', '\n', '. ', ' '];
        let chosenDelim = '';
        for (const d of delimiters) {
            if (content.includes(d)) { chosenDelim = d; break; }
        }

        const parts = content.split(chosenDelim);
        const results = [];
        let buffer = [];
        let bufferLen = 0;

        for (const part of parts) {
            if (bufferLen + part.length > maxLen && buffer.length > 0) {
                results.push(buffer.join(chosenDelim));
                while (bufferLen > overlap && buffer.length > 1) {
                    bufferLen -= buffer[0].length + chosenDelim.length;
                    buffer.shift();
                }
            }
            buffer.push(part);
            bufferLen += part.length + chosenDelim.length;
        }

        if (buffer.length > 0) {
            results.push(buffer.join(chosenDelim));
        }

        const finalResults = [];
        for (const r of results) {
            if (r.length > maxLen && chosenDelim !== ' ') {
                finalResults.push(...this._splitRecursively(r, maxLen, overlap));
            } else {
                finalResults.push(r);
            }
        }

        return finalResults;
    }
}
