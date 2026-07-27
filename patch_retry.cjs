const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

const oldCatch = `            const isRetryable = err.message && (
                err.message.toLowerCase().includes('quota') ||
                err.message.toLowerCase().includes('503') ||
                err.message.toLowerCase().includes('429') ||
                err.message.toLowerCase().includes('fetch')
            );`;

const newCatch = `            const isRetryable = err.message && (
                err.message.toLowerCase().includes('quota') ||
                err.message.toLowerCase().includes('503') ||
                err.message.toLowerCase().includes('429') ||
                err.message.toLowerCase().includes('fetch') ||
                err.message.toLowerCase().includes('json') ||
                err.message.toLowerCase().includes('parse') ||
                err.message.toLowerCase().includes('định dạng')
            );`;

code = code.replace(oldCatch, newCatch);
fs.writeFileSync('services/geminiService.ts', code);
