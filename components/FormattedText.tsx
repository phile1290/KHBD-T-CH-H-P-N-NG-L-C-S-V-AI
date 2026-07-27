import React from 'react';
import { cleanPrefix } from '../utils';

interface Props {
    text: string;
}

const FormattedText: React.FC<Props> = ({ text }) => {
    if (!text) return null;
            
    // Pre-process special tags to ensure they are on their own lines for splitting
    let processedText = text
        .replace(/(\[Gợi ý hình ảnh:|Gợi ý hình ảnh:|\(Gợi ý hình ảnh:)/gi, '\n$1')
        .replace(/(\[Tích hợp\]:|Tích hợp:)/gi, '\n$1');

    const cleanedText = cleanPrefix(processedText);
    const lines = cleanedText.split('\n');
    
    return (
        <>
            {lines.map((line, index) => {
                let trimmedLine = line.trim();
                if (!trimmedLine) return null; 

                const imageRegex = /^[-–\*\s]*(\[|\()?Gợi ý hình ảnh/i;
                const integratedRegex = /^[-–\*\s]*(\[Tích hợp\]|Tích hợp)[:\s]*/i;

                const isImageSuggestion = imageRegex.test(trimmedLine);
                const isIntegrated = integratedRegex.test(trimmedLine);
                
                // Base style for Times New Roman content
                const baseStyle: React.CSSProperties = { 
                    textAlign: 'justify', 
                    fontFamily: '"Times New Roman", serif', 
                    fontSize: '14pt', 
                    lineHeight: '1.3', 
                    margin: '0 0 3pt 0' 
                };
                
                if (isImageSuggestion) {
                    const cleanImageText = trimmedLine.replace(/^[-–\*\s]+/, ''); 
                    return (
                        <div key={index} style={{ 
                            ...baseStyle, 
                            color: '#0044cc', 
                            fontStyle: 'italic', 
                            display: 'block'
                        }}>
                            {cleanImageText}
                        </div>
                    );
                }

                if (isIntegrated) {
                    let content = trimmedLine.replace(/^[-–\*\s]*(\[Tích hợp\]|Tích hợp)[:\s]*/i, '').trim();
                    if (!content.startsWith('-')) content = `- ${content}`;
                    return (
                        <div key={index} style={{
                            ...baseStyle,
                            color: '#d32f2f', 
                            fontStyle: 'italic',
                            textDecoration: 'underline'
                        }}>
                            {content}
                        </div>
                    );
                }

                // Parse bold markdown - user requested normal text, so we just strip the **
                const cleanText = trimmedLine.replace(/\*\*/g, '');
                return (
                    <div key={index} style={baseStyle}>
                        {cleanText}
                    </div>
                );
            }).filter(Boolean)}
        </>
    );
};

export default FormattedText;