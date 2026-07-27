import { GoogleGenAI, Part } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { ImageFile, InputState, LessonPlanResponse, SourceType } from "../types";
import { fileToBase64, sanitizeAndParseJSON } from "../utils";

interface GenerateParams {
    inputData: InputState;
    sourceType: SourceType;
    images: ImageFile[];
    pdfFile: File | null;
    referencePdfs: File[];
    apiKey: string;
}

export const generateLessonPlan = async ({
    inputData,
    sourceType,
    images,
    pdfFile,
    referencePdfs,
    apiKey
}: GenerateParams): Promise<LessonPlanResponse> => {
    
    

    const numPeriods = parseInt(inputData.periods, 10);
    const totalDuration = parseInt(inputData.duration, 10) || 35;
    
    let contentInstruction = "";
    if (sourceType === 'image') {
        contentInstruction = `NGUỒN DỮ LIỆU CHÍNH: Sử dụng nội dung từ các hình ảnh SGK đính kèm.`;
    } else {
        contentInstruction = `NGUỒN DỮ LIỆU CHÍNH: File PDF SGK. NHIỆM VỤ CỦA BẠN: Trích xuất nội dung bài "${inputData.lessonName}" để soạn bài.`;
    }

    let selectedIntegrations = [];
    if (inputData.integrateDigitalSkills) selectedIntegrations.push("Năng lực số");
    if (inputData.integrateAI) selectedIntegrations.push("AI");

    let integrationInstruction = "";
    if (selectedIntegrations.length > 0) {
        integrationInstruction = `- Lĩnh vực tích hợp: ${selectedIntegrations.join(" và ")}. \n- Ghi chú thêm: ${inputData.integrationNotes || 'Tự suy luận dựa trên tài liệu'}\n- YÊU CẦU TRONG MỤC YÊU CẦN ĐẠT (Objectives): Yêu cầu cần đạt tích hợp phải là một NỘI DUNG RIÊNG BIỆT, độc lập, tuyệt đối không lấy từ sách giáo khoa bài học. NGUYÊN TẮC QUAN TRỌNG: Tài liệu tích hợp tải lên là khung năng lực tổng quát, không dành cho một bài học cụ thể nào. Do đó, bạn PHẢI TRIỂN KHAI MỘT CÁCH CHI TIẾT VÀ CỤ THỂ HOÁ nội dung đó vào đúng bối cảnh của bài học hiện tại (Lớp ${inputData.grade}, Bài ${inputData.lessonName}). Trình bày bằng mẫu sau (đặt như một gạch đầu dòng bình thường trong mảng objectives):\n  Ví dụ: "Năng lực số (NLS): Nhận biết được cách bảo vệ thiết bị (không dùng vật nhọn chạm vào màn hình)..."\n  Ví dụ: "Năng lực AI: Nhận biết AI là một loại phần mềm thông minh; Nêu được ví dụ công cụ AI hỗ trợ con người..."\n- YÊU CẦU TRONG CÁC HOẠT ĐỘNG DẠY HỌC: Nội dung tích hợp trong các hoạt động dạy học BẮT BUỘC SỬ DỤNG TÀI LIỆU THAM CHIẾU nhưng PHẢI ĐƯỢC VIẾT RÕ RÀNG SỰ THỂ HIỆN CỦA NÓ TRONG BÀI HỌC (Ví dụ: Ứng dụng kỹ năng đó để giải bài tập nào, thực hành phần nào). TUYỆT ĐỐI KHÔNG COPY NGUYÊN VĂN MỘT CÁCH CHUNG CHUNG từ khung năng lực. Phân tích sự liên kết bằng cú pháp [Tích hợp]: ...\n- KPI TÍCH HỢP HOẠT ĐỘNG (ÁP DỤNG RIÊNG CHO TỪNG TIẾT HỌC): TẤT CẢ các hoạt động dạy học đều phải thể hiện nội dung tích hợp. ĐỐI VỚI MỖI TIẾT HỌC (MỖI PERIOD RIÊNG BIỆT), số lượng gạch đầu dòng nội dung tích hợp (được đánh dấu [Tích hợp]) phải TỪ 8 ĐẾN 10 GẠCH ĐẦU DÒNG HOẶC HƠN (BẮT BUỘC KHÔNG ĐƯỢC DƯỚI 8 GẠCH ĐẦU DÒNG TÍCH HỢP CHO 1 TIẾT). Ví dụ: Nếu bài học có 2 tiết thì Tiết 1 phải có >= 8 dòng tích hợp và Tiết 2 cũng phải có >= 8 dòng tích hợp.`;
    } else {
        integrationInstruction = `- KHÔNG CÓ LĨNH VỰC TÍCH HỢP. TUYỆT ĐỐI KHÔNG tạo các dòng có chữ [Tích hợp] trong kế hoạch bài dạy.`;
    }

    const userPrompt = `
        THÔNG TIN CHUNG: Tuần ${inputData.week}, Môn ${inputData.subject}, Lớp ${inputData.grade}.
        TÊN BÀI DẠY (DỰ KIẾN): ${inputData.lessonName || "Dựa theo nội dung"}
        SỐ TIẾT: ${numPeriods}. THỜI LƯỢNG: ${totalDuration} phút/tiết.
        GHI CHÚ THÊM: ${inputData.context}
        
        ${contentInstruction}
        **YÊU CẦU TÍCH HỢP:**
        ${integrationInstruction}
        - Nếu có Tài liệu tham khảo, hãy dùng nó.
        
        **NHẮC LẠI YÊU CẦU BẮT BUỘC (V46):**
        1. **CẤU TRÚC:** Đủ 4 hoạt động.
        2. **KPI GẠCH ĐẦU DÒNG (Không tính hình ảnh và tích hợp):**
            - Mở đầu >= 4.
            - KT Mới >= 8.
            - Luyện tập >= 10.
            - Vận dụng >= 4.
            - BẮT BUỘC: Cột Giáo viên có bao nhiêu gạch đầu dòng thì cột Học sinh phải có đúng bấy nhiêu gạch đầu dòng tương ứng (Tỷ lệ 1:1).
        3. **HÌNH ẢNH:**
            - Tối thiểu 3 hình/tiết.
            - CHỈ CÓ Ở CỘT GIÁO VIÊN.
            - Không dùng gạch đầu dòng.
            - Sử dụng cú pháp [Gợi ý hình ảnh: <Mô tả chi tiết bằng tiếng Việt>] để gợi ý cho giáo viên.
        4. **THỜI GIAN:** BẮT BUỘC tổng thời gian của 4 hoạt động phải bằng chính xác ${totalDuration} phút. TUYỆT ĐỐI KHÔNG mặc định phân bổ kiểu 5-10-15-5 hay chia đều. Bạn PHẢI TỰ ĐÁNH GIÁ ĐỘ KHÓ VÀ DUNG LƯỢNG NỘI DUNG để phân bổ thời gian một cách LINH HOẠT VÀ KHOA HỌC NHẤT (ví dụ: 3-12-16-4, 6-14-10-5, v.v.). Đảm bảo tổng thời gian cộng lại bằng đúng số người dùng nhập.
    `;

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
};
