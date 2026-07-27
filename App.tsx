import React, { useState } from 'react';
import { 
    BookOpen, FileText, Download, Send, Settings, 
    CheckCircle, Smartphone, AlertTriangle, Plus, X, 
    AlignJustify, Link2, FileUp, Image as ImageIcon, Paperclip, Key
, Trash2} from 'lucide-react';
import { InputState, SourceType, ImageFile, LessonPlanResponse } from './types';
import { generateLessonPlan } from './services/geminiService';
import { exportToWord } from './utils';
import LessonPreview from './components/LessonPreview';

const App: React.FC = () => {
    // API Key State
    const [userApiKey, setUserApiKey] = useState<string>('');

    // Load API Key on mount
    React.useEffect(() => {
        const storedKey = localStorage.getItem('geminiApiKey');
        if (storedKey) {
            setUserApiKey(storedKey);
        }
    }, []);

    // UI State
    const [sourceType, setSourceType] = useState<SourceType>('image');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [result, setResult] = useState<LessonPlanResponse | null>(null);

    // File Inputs
    const [images, setImages] = useState<ImageFile[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [referencePdfs, setReferencePdfs] = useState<File[]>([]);

    // Form Data
    const [inputData, setInputData] = useState<InputState>({
        week: '',
        subject: '',        
        grade: '',          
        periods: '',       
        duration: '',
        lessonName: '',     
        context: '',
        integrateDigitalSkills: false, 
        integrateAI: false,
        integrationNotes: ''
    });

    // --- Handlers ---
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const newImages = filesArray.map((file) => ({
                file: file as File,
                previewUrl: URL.createObjectURL(file as File)
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
        }
    };
    
    const handleReferencePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files) as File[];
            const oversized = newFiles.filter(f => f.size > 100 * 1024 * 1024);
            if (oversized.length > 0) {
                setError(`Cảnh báo: Tệp "${oversized[0].name}" quá lớn. Vui lòng tải lên tệp dưới 100MB.`);
            }
            const validFiles = newFiles.filter(f => f.size <= 100 * 1024 * 1024);
            setReferencePdfs(prev => [...prev, ...validFiles]);
            e.target.value = '';
        }
    };
    
    const removeReferencePdf = (index: number) => {
        setReferencePdfs(prev => prev.filter((_, i) => i !== index));
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].previewUrl);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleGenerate = async () => {
        // Validations
        if (sourceType === 'image' && images.length === 0) {
            setError('Vui lòng tải lên ảnh SGK.');
            return;
        }
        if (sourceType === 'pdf' && !pdfFile) {
            setError('Vui lòng tải lên file PDF Sách giáo khoa.');
            return;
        }
        if (!inputData.periods) {
            setError('Vui lòng nhập số tiết.');
            return;
        }
        if (sourceType === 'pdf' && !inputData.lessonName) {
            setError('Với file PDF SGK, bạn bắt buộc phải nhập "Tên bài học" để AI trích xuất nội dung.');
            return;
        }

        let totalSize = 0;
        if (sourceType === 'pdf' && pdfFile) {
            totalSize += pdfFile.size;
        } else if (sourceType === 'image') {
            totalSize += images.reduce((sum, img) => sum + img.file.size, 0);
        }
        totalSize += referencePdfs.reduce((sum, f) => sum + f.size, 0);

        if (totalSize > 100 * 1024 * 1024) {
            setError(`Tổng dung lượng các file tải lên (${(totalSize / (1024*1024)).toFixed(1)}MB) vượt quá giới hạn cho phép (100MB). Vui lòng giảm bớt file, chia nhỏ tài liệu, hoặc sử dụng công cụ nén file PDF trước khi tải lên.`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await generateLessonPlan({
                inputData,
                sourceType,
                images,
                pdfFile,
                referencePdfs,
                apiKey: userApiKey.trim()
            });
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-2 md:p-8">
            <header className="mb-6 flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-0 z-20">
                <div className="flex items-center gap-3 mb-3 md:mb-0">
                    <div className="bg-teal-600 p-2 rounded-lg text-white">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 uppercase">Kế hoạch bài dạy tích hợp năng lực số và AI</h1>
                        <p className="text-xs text-gray-500">Ứng dụng được phát triển bởi thầy giáo Lê Văn Phi</p>
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: INPUTS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="flex items-center gap-2 font-bold text-gray-700 mb-4">
                            <Settings size={20} /> THIẾT LẬP THÔNG SỐ
                        </h2>

                        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1"><Key size={14} /> Gemini API Key</span>
                                {userApiKey && <span className="text-green-600 font-normal flex items-center gap-1"><CheckCircle size={12} /> Đã lưu</span>}
                            </label>
                            <input 
                                type="password" 
                                placeholder="Nhập API Key của bạn..." 
                                className="w-full p-2 border border-blue-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500" 
                                value={userApiKey} 
                                onChange={(e) => {
                                    setUserApiKey(e.target.value);
                                    localStorage.setItem('geminiApiKey', e.target.value);
                                }} 
                            />
                            <p className="text-[10px] text-blue-600 mt-1 italic">API Key được lưu tự động trên trình duyệt, bạn không cần nhập lại ở lần truy cập sau.</p>
                        </div>
                        
                        <div className="space-y-3">
                            {/* Subject & Grade */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Môn học</label>
                                    <input type="text" placeholder="VD: Tin học" className="w-full p-2 border rounded-md text-sm outline-none focus:border-teal-500" value={inputData.subject} onChange={(e) => setInputData({...inputData, subject: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Lớp</label>
                                    <input type="text" placeholder="VD: 4A" className="w-full p-2 border rounded-md text-sm outline-none focus:border-teal-500" value={inputData.grade} onChange={(e) => setInputData({...inputData, grade: e.target.value.toUpperCase()})} />
                                </div>
                            </div>

                            {/* Week & Lesson Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Tuần</label>
                                <input type="number" placeholder="VD: 12" className="w-full p-2 border rounded-md text-sm outline-none focus:border-teal-500" value={inputData.week} onChange={(e) => setInputData({...inputData, week: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-700 mb-1">Tên bài / Số bài (Bắt buộc cho PDF SGK)</label>
                                <input type="text" placeholder="VD: Bài 10: Làm quen với máy tính" className="w-full p-2 border border-blue-300 bg-blue-50 rounded-md text-sm outline-none font-medium focus:ring-1 focus:ring-blue-500" value={inputData.lessonName} onChange={(e) => setInputData({...inputData, lessonName: e.target.value})} />
                            </div>

                            {/* Duration */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Số tiết</label>
                                    <input type="number" placeholder="VD: 1" className="w-full p-2 border rounded-md text-sm outline-none focus:border-teal-500" value={inputData.periods} onChange={(e) => setInputData({...inputData, periods: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Phút/tiết</label>
                                    <input type="number" placeholder="VD: 35" className="w-full p-2 border rounded-md text-sm outline-none focus:border-teal-500" value={inputData.duration} onChange={(e) => setInputData({...inputData, duration: e.target.value})} />
                                </div>
                            </div>
                            
                            {/* Source Selection */}
                            <div className="mt-4 pt-4 border-t">
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Nguồn Dữ Liệu Chính (SGK)</label>
                                <div className="flex gap-2 mb-3">
                                    <button 
                                        onClick={() => setSourceType('image')}
                                        className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors ${sourceType === 'image' ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        <ImageIcon size={14} /> Dùng Ảnh
                                    </button>
                                    <button 
                                        onClick={() => setSourceType('pdf')}
                                        className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors ${sourceType === 'pdf' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        <FileUp size={14} /> Dùng PDF
                                    </button>
                                </div>

                                {sourceType === 'image' ? (
                                    <div>
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                            {images.map((img, idx) => (
                                                <div key={idx} className="relative group aspect-[3/4] rounded-lg overflow-hidden border">
                                                    <img src={img.previewUrl} className="w-full h-full object-cover" alt={`Upload ${idx}`} />
                                                    <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-[3/4] cursor-pointer hover:bg-gray-50 transition-colors">
                                                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                                <Plus size={24} className="text-gray-400" />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 border-2 border-dashed border-red-300 rounded-lg bg-red-50 text-center hover:bg-red-100 transition-colors">
                                        <input type="file" accept=".pdf" onChange={handlePdfChange} className="hidden" id="pdf-upload" />
                                        <label htmlFor="pdf-upload" className="cursor-pointer block">
                                            <FileUp size={32} className="mx-auto text-red-400 mb-2" />
                                            {pdfFile ? (
                                                <span className="text-sm font-bold text-red-700">{pdfFile.name}</span>
                                            ) : (
                                                <div>
                                                    <span className="block text-sm font-bold text-gray-700">Tải lên Sách Giáo Khoa PDF</span>
                                                    <span className="block text-xs text-gray-500">(AI sẽ tự tìm nội dung bài học)</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Integration */}
                            <div className="grid grid-cols-1 gap-3 border-t pt-3 mt-3 border-dashed">
                                <h3 className="text-xs font-bold text-teal-700 flex items-center gap-1">
                                    <Link2 size={14} /> LĨNH VỰC TÍCH HỢP
                                </h3>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" 
                                            checked={inputData.integrateDigitalSkills}
                                            onChange={(e) => setInputData({...inputData, integrateDigitalSkills: e.target.checked})}
                                        />
                                        Năng lực số
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500" 
                                            checked={inputData.integrateAI}
                                            onChange={(e) => setInputData({...inputData, integrateAI: e.target.checked})}
                                        />
                                        AI
                                    </label>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1 uppercase">
                                        <Paperclip size={12} /> Tài liệu tham khảo tích hợp (PDF)
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <div className="p-4 border-2 border-dashed border-teal-300 rounded-lg bg-teal-50 text-center hover:bg-teal-100 transition-colors">
                                            <input type="file" accept=".pdf" multiple onChange={handleReferencePdfChange} className="hidden" id="ref-pdf-upload" />
                                            <label htmlFor="ref-pdf-upload" className="cursor-pointer block">
                                                <FileUp size={32} className="mx-auto text-teal-400 mb-2" />
                                                <span className="block text-sm font-bold text-gray-700">Tải lên các tệp PDF tham khảo</span>
                                                <span className="block text-xs text-gray-500">(Nhiều file được hỗ trợ)</span>
                                            </label>
                                        </div>
                                        
                                        {referencePdfs.length > 0 && (
                                            <div className="flex flex-col gap-2">
                                                {referencePdfs.map((file, i) => (
                                                    <div key={i} className="p-3 border-2 border-teal-300 rounded-lg bg-teal-50 flex items-center justify-between transition-colors">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <FileText size={20} className="text-teal-500 flex-shrink-0" />
                                                            <span className="text-sm font-bold text-teal-700 truncate">{file.name}</span>
                                                        </div>
                                                        <button onClick={() => removeReferencePdf(i)} className="text-red-500 hover:text-red-700 p-1.5 flex-shrink-0 bg-white rounded-md shadow-sm border border-red-100 hover:bg-red-50 transition-colors" title="Xóa file">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <textarea 
                                    className="w-full p-2 border rounded-md text-sm h-16 resize-none outline-none focus:border-teal-500" 
                                    placeholder="Ghi chú thêm về nội dung tích hợp..." 
                                    value={inputData.integrationNotes} 
                                    onChange={(e) => setInputData({...inputData, integrationNotes: e.target.value})} 
                                />
                            </div>

                            {/* ACTION BUTTON */}
                            <button 
                                onClick={handleGenerate} 
                                disabled={loading} 
                                className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-white shadow-md transition-all ${loading ? 'opacity-80 cursor-wait bg-teal-600' : 'bg-teal-600 hover:bg-teal-700'}`} 
                            >
                                <Send size={18} className={loading ? "animate-pulse" : ""} />
                                {loading ? 'ĐANG SOẠN...' : 'SOẠN KẾ HOẠCH BÀI DẠY'}
                            </button>
                            
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW */}
                <div className="lg:col-span-8 overflow-hidden">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col min-h-[600px]">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
                            <h2 className="font-bold text-gray-700 flex items-center gap-2">
                                <FileText size={20} /> Xem trước
                            </h2>
                            {result && (
                                <button onClick={() => exportToWord(result, 'lesson-preview-content')} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition-colors shadow-sm">
                                    <Download size={16} /> Tải về (.doc)
                                </button>
                            )}
                        </div>
                        <div className="p-4 md:p-8 overflow-auto flex-1 bg-white">
                            {!result ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                    <FileText size={64} className="mb-4 text-gray-300" />
                                    <p>Kết quả sẽ hiển thị ở đây</p>
                                </div>
                            ) : (
                                <LessonPreview 
                                    id="lesson-preview-content" 
                                    result={result} 
                                    inputData={inputData} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;