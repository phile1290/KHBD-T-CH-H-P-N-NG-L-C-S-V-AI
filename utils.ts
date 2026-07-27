import { LessonPlanResponse } from './types';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result?.toString();
            if (result) {
                // Remove data url prefix (e.g. "data:image/jpeg;base64,")
                const base64Data = result.split(',')[1];
                resolve(base64Data);
            } else {
                reject(new Error("Failed to convert file to base64"));
            }
        };
        reader.onerror = error => reject(error);
    });
};

export const sanitizeAndParseJSON = (text: string): LessonPlanResponse => {
    try {
        const firstBrace = text.indexOf('{');
        
        if (firstBrace === -1) {
            throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi.");
        }
        
        let braceCount = 0;
        let lastBrace = -1;
        
        // Match the first valid complete JSON object
        for (let i = firstBrace; i < text.length; i++) {
            if (text[i] === '{') braceCount++;
            else if (text[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    lastBrace = i;
                    break;
                }
            }
        }

        if (lastBrace === -1) {
             throw new Error("JSON không hoàn chỉnh (thiếu dấu ngoặc).");
        }
        
        let jsonString = text.substring(firstBrace, lastBrace + 1);
        jsonString = jsonString
            .replace(/```json/g, '')
            .replace(/```/g, '')
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error Raw Text:" + text);
        throw e;
    }
};

export const cleanPrefix = (text: string | null | undefined): string => {
    if (!text) return "";
    let cleaned = text.replace(/^[-–\*\s]*(GV|Giáo viên|HS|Học sinh|Thầy|Cô)\s*[:\.]\s*/gim, '');
    cleaned = cleaned.replace(/[-–\*\s]*(GV|Giáo viên|HS|Học sinh|Thầy|Cô)\s*[:\.]\s*/gim, '');
    return cleaned;
};

export const alignContent = (teacherText: string, studentText: string) => {
    let processedTeacher = (teacherText || '')
        .replace(/(\[Gợi ý hình ảnh:|Gợi ý hình ảnh:|\(Gợi ý hình ảnh:)/gi, '$1')
        .replace(/(\[Tích hợp\]:|Tích hợp:)/gi, '$1');
        
    let processedStudent = (studentText || '')
        .replace(/(\[Tích hợp\]:|Tích hợp:)/gi, '$1');

    const tLines = cleanPrefix(processedTeacher).split('').map(l => l.trim()).filter(Boolean);
    const sLines = cleanPrefix(processedStudent).split('').map(l => l.trim()).filter(Boolean);

    const alignedRows = [];
    let tIndex = 0;
    let sIndex = 0;

    while (tIndex < tLines.length || sIndex < sLines.length) {
        const tLine = tLines[tIndex] || '';
        const sLine = sLines[sIndex] || '';

        const isImage = /^[-–\*\s]*(\[|\()?Gợi ý hình ảnh/i.test(tLine);
        
        if (isImage) {
            alignedRows.push({ teacher: tLine, student: '' });
            tIndex++;
        } else {
            alignedRows.push({ teacher: tLine, student: sLine });
            if (tIndex < tLines.length) tIndex++;
            if (sIndex < sLines.length) sIndex++;
        }
    }
    return alignedRows;
};

export const formatActivityName = (name: string): string => {
    const cleanName = (name || '').trim();
    const lower = cleanName.toLowerCase();
    
    if (lower.includes("mở đầu") || lower.includes("khởi động")) return "1. Hoạt động mở đầu";
    if (lower.includes("kiến thức") || lower.includes("khám phá")) return "2. Hoạt động hình thành kiến thức mới";
    if (lower.includes("luyện tập") || lower.includes("thực hành")) return "3. Hoạt động luyện tập, thực hành";
    if (lower.includes("vận dụng") || lower.includes("trải nghiệm")) return "4. Hoạt động vận dụng, trải nghiệm";
    
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
};

export const formatTopicName = (topic: string): string => {
    let text = (topic || '').trim();
    text = text.replace(/<\/?u>/g, '').replace(/<\/?b>/g, '').replace(/\*\*/g, '');
    text = text.replace(/^([\d\w]+[\.\/])\s*/, '* ');
    if (!text.startsWith('*') && text.length > 0) text = '* ' + text;
    return text;
};

export const exportToWord = (result: LessonPlanResponse, elementId: string) => {
    const contentElement = document.getElementById(elementId);
    if (!contentElement) return;

    const contentHTML = contentElement.innerHTML;
    const lessonTitle = result.lesson_full_title || "Ke_Hoach_Bai_Day";
    const safeName = lessonTitle.replace(/[\/\\?%*:|"<>]/g, '-').trim();
    const fileName = `${safeName}.doc`;

    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${result.lesson_full_title}</title>
        <style>
            @page { size: A4; margin: 2.0cm 2.0cm 2.0cm 3.0cm; mso-page-orientation: portrait; }
            body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.3; }
            p, div { margin-top: 0; margin-bottom: 3pt; }
            table { border-collapse: collapse; width: 100%; table-layout: fixed; border: 2px solid black; }
            td { padding: 5px; vertical-align: top; border-left: 1px solid black; border-right: 1px solid black; }
            thead { display: table-header-group; }
            .header-row td { border-top: 1px solid black !important; border-bottom: 1px solid black !important; font-weight: bold; background-color: #f2f2f2; text-align: center; vertical-align: middle; }
            .no-top-border { border-top: none !important; }
            .has-top-border { border-top: 1px solid black !important; }
            table { mso-border-bottom-alt: solid black 1.0pt; }
            br.page-break { page-break-before: always; }
        </style></head><body>`;
    
    const footer = `</body></html>`;
    const blob = new Blob(['\ufeff', header + contentHTML + footer], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
export const uploadFileToGeminiREST = async (file: File, apiKey: string): Promise<{ fileUri: string, mimeType: string, name: string }> => {
    let delay = 1000;
    let lastErr: any;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            // 1. Start Resumable Upload
            const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'X-Goog-Upload-Protocol': 'resumable',
                    'X-Goog-Upload-Command': 'start',
                    'X-Goog-Upload-Header-Content-Length': file.size.toString(),
                    'X-Goog-Upload-Header-Content-Type': file.type || 'application/pdf',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ file: { display_name: file.name } })
            });
            
            if (!startRes.ok) {
                const errText = await startRes.text();
                throw new Error("Lỗi khởi tạo upload: " + errText);
            }
            
            const uploadUrl = startRes.headers.get('x-goog-upload-url');
            if (!uploadUrl) throw new Error("Không nhận được URL upload từ Gemini");
            
            // 2. Chunked Upload Data
            const chunkSize = 8 * 1024 * 1024; // 8MB
            let offset = 0;
            
            while (offset < file.size) {
                const chunk = file.slice(offset, offset + chunkSize);
                const isFinal = offset + chunk.size >= file.size;
                
                const uploadRes = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'X-Goog-Upload-Command': isFinal ? 'upload, finalize' : 'upload',
                        'X-Goog-Upload-Offset': offset.toString(),
                        'Content-Length': chunk.size.toString(),
                        'Content-Type': file.type || 'application/pdf'
                    },
                    body: chunk
                });
                
                if (!uploadRes.ok) {
                    const errText = await uploadRes.text();
                    throw new Error("Lỗi tải dữ liệu lên Gemini: " + errText);
                }
                
                if (isFinal) {
                    const fileInfo = await uploadRes.json();
                    return {
                        fileUri: fileInfo.file.uri,
                        mimeType: fileInfo.file.mimeType,
                        name: fileInfo.file.name
                    };
                }
                
                offset += chunk.size;
            }
        } catch (err: any) {
            lastErr = err;
            console.error("Upload error attempt " + attempt, err);
            if (attempt < 3) {
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            }
        }
    }
    
    throw new Error(lastErr?.message || "Không thể tải file lên Gemini sau nhiều lần thử.");
};