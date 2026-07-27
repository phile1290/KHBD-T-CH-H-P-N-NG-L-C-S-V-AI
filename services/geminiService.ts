import { Part } from "@google/genai";
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
    
    // Chunk upload helper
    const uploadFileInChunks = async (file: File): Promise<string> => {
        const fileId = Math.random().toString(36).substring(2, 15) + Date.now().toString();
        const chunkSize = 1024 * 1024 * 2; // 2MB
        const totalChunks = Math.ceil(file.size / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
            const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
            const base64Chunk = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(chunk);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
            });

            const res = await fetch('/api/upload-chunk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId,
                    chunkIndex: i,
                    totalChunks,
                    data: base64Chunk
                })
            });
            if (!res.ok) throw new Error(`Lỗi khi tải lên file: ${file.name}`);
        }
        return fileId;
    };

    let mainFileId: string | null = null;
    let mainImages: { fileId: string; mimeType: string }[] = [];
    let referenceFileIds: string[] = [];

    // 1. Upload Main Source
    if (sourceType === 'image') {
        for (const img of images) {
            const fileId = await uploadFileInChunks(img.file);
            mainImages.push({ fileId, mimeType: img.file.type });
        }
    } else if (sourceType === 'pdf' && pdfFile) {
        mainFileId = await uploadFileInChunks(pdfFile);
    }

    // 2. Upload Reference
    if (referencePdfs && referencePdfs.length > 0) {
        for (const file of referencePdfs) {
            const fileId = await uploadFileInChunks(file);
            referenceFileIds.push(fileId);
        }
    }

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

    // Send payload to backend
    let delay = 1000;
    for (let i = 0; i <= 5; i++) {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userPrompt,
                    sourceType,
                    mainFileId,
                    mainImages,
                    referenceFileIds,
                    systemInstruction: SYSTEM_PROMPT,
                    apiKey
                })
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Server responded with an error');
                } else {
                    const text = await response.text();
                    if (response.status === 413 || text.includes('PayloadTooLargeError') || text.includes('413')) {
                         throw new Error("Kích thước file tải lên quá lớn. Vui lòng giảm dung lượng file hoặc sử dụng ít file hơn (giới hạn 100MB).");
                    }
                    throw new Error(`Lỗi máy chủ (${response.status}): Không thể xử lý yêu cầu.`);
                }
            }

            const data = await response.json();
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
                throw err;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; 
        }
    }
    throw new Error("Unknown error occurred");
};