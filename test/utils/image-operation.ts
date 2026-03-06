import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const normalizeStoredFilename = (value: string): string => {
    return path.basename(value.trim().replace(/^["']|["']$/g, ''));
};

export const extractFilename = (response: { body: any; text: string }): string | undefined => {
    if (typeof response.body === 'string') {
        return normalizeStoredFilename(response.body);
    }

    if (response.body && typeof response.body === 'object') {
        const candidates = [
            response.body.fileKey,
            response.body.data,
            response.body.name,
            response.body.filename,
            response.text
        ];

        const firstString = candidates.find((val) => typeof val === 'string');
        if (typeof firstString === 'string' && firstString.length > 0) {
            return normalizeStoredFilename(firstString);
        }
        return undefined;
    }

    if (typeof response.text === 'string' && response.text.length > 0) {
        return normalizeStoredFilename(response.text);
    }

    return undefined;
};

export const createTempImage = (tmpDir: string, filenamePrefix: string, content: string): string => {
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, `${filenamePrefix}-${uuidv4()}.jpeg`);
    fs.writeFileSync(filePath, content);
    return filePath;
};