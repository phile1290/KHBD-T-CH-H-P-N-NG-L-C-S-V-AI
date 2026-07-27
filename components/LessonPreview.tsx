import React from 'react';
import { LessonPlanResponse, Period } from '../types';
import { formatActivityName, formatTopicName, alignContent } from '../utils';
import FormattedText from './FormattedText';

interface Props {
    result: LessonPlanResponse;
    inputData: any;
    id?: string;
}

const LessonPreview: React.FC<Props> = ({ result, inputData, id }) => {
    
    const renderSinglePeriod = (period: Period, index: number) => {
        let lessonTitle = result.lesson_full_title || "";
        const periodSuffix = `(TIẾT ${period.period_number || index + 1})`;
        
        lessonTitle = lessonTitle.replace(/Tiết\s+\d+\s+(và|&)\s+\d+/gi, '').replace(/\(.*phút.*\)/gi, '').trim();
        if (!lessonTitle.toUpperCase().includes("TIẾT")) lessonTitle += ` ${periodSuffix}`;
        else if (!lessonTitle.includes(periodSuffix)) lessonTitle += ` ${periodSuffix}`;

        const displayWeek = inputData.week || result.week || '...';
        
        const styles = {
            container: { marginBottom: '40px', fontFamily: '"Times New Roman", serif', fontSize: '14pt', lineHeight: '1.3' },
            headerCenter: { textAlign: 'center' as const, fontWeight: 'bold', marginBottom: '4px', fontSize: '14pt' },
            headerRight: { textAlign: 'right' as const, fontStyle: 'italic', fontSize: '14pt', marginBottom: '8px' }, 
            title: { textAlign: 'center' as const, fontSize: '14pt', marginBottom: '16px', fontWeight: 'bold', textTransform: 'uppercase' as const },
            sectionTitle: { fontWeight: 'bold', textTransform: 'uppercase' as const, marginBottom: '3pt', marginTop: '16px', fontSize: '14pt' },
            justify: { textAlign: 'justify' as const, fontSize: '14pt' },
            table: { width: '100%', minWidth: '700px', tableLayout: 'fixed' as const, borderCollapse: 'collapse' as const, marginBottom: '0px', border: '2px solid black', borderBottom: '2px solid black', fontSize: '14pt' }, 
            headerCell: { borderTop: '1px solid black', borderBottom: '1px solid black', borderRight: '1px solid black', borderLeft: '1px solid black', padding: '5px', textAlign: 'center' as const, verticalAlign: 'middle', fontWeight: 'bold', backgroundColor: '#f2f2f2' },
            bodyCellBase: { borderRight: '1px solid black', borderLeft: '1px solid black', padding: '5px', verticalAlign: 'top', textAlign: 'justify' as const },
            bodyCellCenterBase: { borderRight: '1px solid black', borderLeft: '1px solid black', padding: '5px', textAlign: 'center' as const, verticalAlign: 'top', fontWeight: 'bold' },
            pageBreak: { pageBreakAfter: 'always' as const, borderBottom: '3px double #ccc', paddingBottom: '20px', marginBottom: '40px', display: 'block' }
        };

        return (
            <div key={index} style={styles.pageBreak} className="period-container">
                <div style={styles.container}>
                    <div style={styles.headerCenter}>KẾ HOẠCH BÀI DẠY – TUẦN {displayWeek}</div>
                    <div style={styles.headerRight}>{result.date_range || 'Từ ngày... đến ngày...'}</div>
                    <div style={styles.headerCenter}>LỚP: {inputData.grade || result.grade_class || "..."}</div>
                    <div style={{...styles.headerCenter, marginBottom: '8px'}}>MÔN HỌC: {inputData.subject ? inputData.subject.toUpperCase() : "..."}</div>
                    <div style={styles.title}>
                        <span style={{fontStyle: 'italic', fontWeight: 'normal', textTransform: 'none'}}>Tên bài dạy: </span>
                        {lessonTitle}
                    </div>

                    <h3 style={styles.sectionTitle}>A. YÊU CẦU CẦN ĐẠT</h3>
                    <div style={styles.justify}>
                        {Array.isArray(period.objectives) && period.objectives.map((item, i) => {
                            const cleanItem = item.replace(/\*\*/g, '');
                            const isIntegration = /(Năng lực số|Năng lực AI|Tích hợp)/i.test(cleanItem);
                            const textLine = cleanItem.startsWith('-') ? cleanItem : `- ${cleanItem}`;
                            return (
                                <div key={i} style={{
                                    marginBottom: '3pt',
                                    fontStyle: isIntegration ? 'italic' : 'normal'
                                }}>
                                    {textLine}
                                </div>
                            );
                        })}
                    </div>

                    <h3 style={styles.sectionTitle}>B. ĐỒ DÙNG DẠY HỌC</h3>
                    <div style={styles.justify}>
                        <div style={{marginBottom: '3pt'}}><span style={{fontWeight: 'bold'}}>1. Giáo viên: </span>{(period.materials?.teacher || '').replace(/\*\*/g, '')}</div>
                        <div style={{marginBottom: '3pt'}}><span style={{fontWeight: 'bold'}}>2. Học sinh: </span>{(period.materials?.student || '').replace(/\*\*/g, '')}</div>
                    </div>

                    <h3 style={{...styles.sectionTitle, marginBottom: '1pt'}}>C. CÁC HOẠT ĐỘNG DẠY HỌC</h3>
                    <div className="overflow-x-auto w-full pb-2">
                        <table style={styles.table}>
                            <colgroup>
                                <col style={{width: '10%'}} /> 
                                <col style={{width: '54%'}} /> 
                                <col style={{width: '36%'}} />
                            </colgroup>
                            <thead>
                                <tr className="header-row">
                                    <td style={styles.headerCell}>TG</td>
                                    <td style={styles.headerCell}>HOẠT ĐỘNG CỦA GIÁO VIÊN</td>
                                    <td style={styles.headerCell}>HOẠT ĐỘNG CỦA HỌC SINH</td>
                                </tr>
                            </thead>
                            <tbody>
                                {period.activities && period.activities.map((act, actIndex) => (
                                    <React.Fragment key={actIndex}>
                                        {act.rows && act.rows.map((row, rowIndex) => {
                                            const alignedSubRows = alignContent(row.teacher, row.student);
                                            
                                            return alignedSubRows.map((subRow, subRowIndex) => {
                                                const isFirstRowOfTableBody = actIndex === 0 && rowIndex === 0 && subRowIndex === 0;
                                                const isFirstRowOfActivity = rowIndex === 0 && subRowIndex === 0;
                                                const topBorderStyle = isFirstRowOfTableBody ? '1px solid black' : 'none';
                                                const className = isFirstRowOfTableBody ? "has-top-border" : "no-top-border";

                                                return (
                                                    <tr key={`${actIndex}-${rowIndex}-${subRowIndex}`}>
                                                        <td className={className} style={{ ...styles.bodyCellCenterBase, borderTop: topBorderStyle }}>
                                                            {isFirstRowOfActivity ? (act.time || '').replace(/phút/gi, "'").replace(/\s/g, '') : ''}
                                                        </td>
                                                        <td className={className} style={{ ...styles.bodyCellBase, borderTop: topBorderStyle }}>
                                                            {isFirstRowOfActivity && (
                                                                <>
                                                                    <div style={{fontWeight: 'bold', marginBottom: '3pt', textTransform: 'none'}}>{formatActivityName(act.name)}</div>
                                                                    {act.topic && <div style={{fontWeight: 'bold', marginBottom: '3pt', textDecoration: 'none'}}>{formatTopicName(act.topic)}</div>}
                                                                </>
                                                            )}
                                                            <FormattedText text={subRow.teacher} />
                                                        </td>
                                                        <td className={className} style={{ ...styles.bodyCellBase, borderTop: topBorderStyle }}>
                                                            {isFirstRowOfActivity && act.topic && <div style={{fontWeight: 'bold', marginBottom: '3pt', visibility: 'hidden'}}>{formatTopicName(act.topic)}</div>}
                                                            {isFirstRowOfActivity && !act.topic && <div style={{visibility: 'hidden', marginBottom: '3pt', height: '1.2em'}}>_</div>}
                                                            <FormattedText text={subRow.student} />
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{marginTop: '1pt', paddingTop: '0px'}}>
                        <h3 style={styles.sectionTitle}>D. ĐIỀU CHỈNH SAU BÀI DẠY</h3>
                        <p style={{fontStyle: 'italic', color: '#666', textAlign: 'justify', marginTop: '3pt'}}>..................................................................................................................................................................................................................................................................................................................</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div id={id} className="max-w-[21cm] mx-auto bg-white text-black p-4">
             {result.periods && result.periods.map((period, idx) => renderSinglePeriod(period, idx))}
        </div>
    );
};

export default LessonPreview;