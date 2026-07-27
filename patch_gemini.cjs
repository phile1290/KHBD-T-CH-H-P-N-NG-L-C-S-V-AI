const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

const target1 = `    // We will still try to use the server API key via a proxy if running locally and no client key is provided
    let useServerProxy = false;
    if (!finalApiKey && process.env.NODE_ENV !== "production") {
        useServerProxy = true; // might not work on vercel but works locally
    }

    if (!finalApiKey && !useServerProxy) {
        throw new Error("Vui lòng nhập Gemini API Key để tạo giáo án.");
    }`;

const replace1 = `    if (!finalApiKey) {
        throw new Error("Vui lòng nhập Gemini API Key để tạo giáo án.");
    }`;

code = code.replace(target1, replace1);

const target2 = `                model: 'gemini-2.5-flash',`;
const replace2 = `                model: 'gemini-2.5-pro',`;

code = code.replace(target2, replace2);

fs.writeFileSync('services/geminiService.ts', code);
