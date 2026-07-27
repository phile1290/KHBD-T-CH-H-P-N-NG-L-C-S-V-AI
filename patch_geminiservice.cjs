const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

// Replace the chunk upload and fetch logic with direct SDK call
const newLogic = `
    let finalApiKey = apiKey;
    if (!finalApiKey) {
        try {
            finalApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
        } catch(e) {}
    }
    
    // We will still try to use the server API key via a proxy if running locally and no client key is provided
    let useServerProxy = false;
    if (!finalApiKey && process.env.NODE_ENV !== "production") {
        useServerProxy = true; // might not work on vercel but works locally
    }

    if (!finalApiKey && !useServerProxy) {
        throw new Error("Vui lòng nhập Gemini API Key để tạo giáo án.");
    }

    const parts: any[] = [];
    
    if (sourceType === 'pdf' && pdfFile) {
        // Validate size for inlineData (limit is 20MB)
        if (pdfFile.size > 20 * 1024 * 1024) {
            throw new Error("Kích thước file PDF quá lớn (giới hạn 20MB). Vui lòng nén file.");
        }
        const base64 = await fileToBase64(pdfFile);
        parts.push({
            inlineData: { data: base64, mimeType: "application/pdf" }
        });
    } else if (sourceType === 'image' && images.length > 0) {
        for (const img of images) {
            const base64 = await fileToBase64(img.file);
            parts.push({
                inlineData: { data: base64, mimeType: img.file.type }
            });
        }
    }

    if (referencePdfs && referencePdfs.length > 0) {
        parts.push({ text: "DƯỚI ĐÂY LÀ (CÁC) FILE PDF TÀI LIỆU THAM KHẢO (SỬ DỤNG LÀM KHUNG CƠ SỞ CHO NỘI DUNG TÍCH HỢP):" });
        for (const ref of referencePdfs) {
            if (ref.size > 20 * 1024 * 1024) {
                throw new Error("Kích thước file tài liệu tham khảo quá lớn (giới hạn 20MB).");
            }
            const base64 = await fileToBase64(ref);
            parts.push({
                inlineData: { data: base64, mimeType: "application/pdf" }
            });
        }
    }

    parts.push({ text: userPrompt });

    let delay = 1000;
    for (let i = 0; i <= 5; i++) {
        try {
            let data: any = null;
            if (finalApiKey) {
                // Client-side SDK call
                const ai = new GoogleGenAI({ apiKey: finalApiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts },
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        responseMimeType: "application/json",
                        temperature: 0.7
                    }
                });
                data = { text: response.text };
            } else {
                // Fallback to proxy (only works if backend is running, i.e. not Vercel static)
                // We will send inlineData to backend. Vercel has 4.5MB limit, so this is just a fallback.
                const response = await fetch('/api/generate-inline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parts,
                        systemInstruction: SYSTEM_PROMPT,
                        apiKey: finalApiKey
                    })
                });
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error("Lỗi máy chủ proxy: " + text);
                }
                data = await response.json();
            }

            if (!data.text) throw new Error("Empty response from AI");
            return sanitizeAndParseJSON(data.text);
        } catch (err: any) {
            console.error("Gemini API Error attempt " + i, err);
            
            const isRetryable = err.message && (
                err.message.toLowerCase().includes('quota') ||
                err.message.toLowerCase().includes('503') ||
                err.message.toLowerCase().includes('429') ||
                err.message.toLowerCase().includes('fetch')
            );
            
            if (i === 5 || !isRetryable) {
                if (isRetryable) throw new Error("Hệ thống quá tải (Quota/Busy), vui lòng thử lại sau.");
                throw new Error(err.message || "Lỗi không xác định");
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; 
        }
    }
    throw new Error("Unknown error occurred");
`;

code = code.substring(0, code.indexOf('// Chunk upload helper')) + newLogic + '};\n';
fs.writeFileSync('services/geminiService.ts', code);
