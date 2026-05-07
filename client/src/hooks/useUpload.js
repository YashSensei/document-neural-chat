import { useState } from 'react';
import { neurolexApi } from '../api/pdfAgent';

export const useUpload = (onSuccess) => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const selectFile = (picked) => {
        if (picked && picked.type === 'application/pdf') {
            setFile(picked);
            setError(null);
        } else {
            setError('Invalid file type. Only PDF documents are accepted.');
        }
    };

    const upload = async () => {
        if (!file) return;

        setStatus('uploading');
        setProgress(15);

        try {
            const ticker = setInterval(() => {
                setProgress(prev => (prev < 85 ? prev + 3 : prev));
            }, 250);

            const result = await neurolexApi.ingestDocument(file);

            clearInterval(ticker);
            setProgress(100);
            setStatus('ready');

            setTimeout(() => onSuccess(result, file), 600);
        } catch (err) {
            setError(err.message);
            setStatus('idle');
            setProgress(0);
        }
    };

    return { file, status, progress, error, selectFile, upload };
};
