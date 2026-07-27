export interface LessonRow {
    teacher: string;
    student: string;
}

export interface Activity {
    time: string;
    name: string;
    topic?: string;
    rows: LessonRow[];
}

export interface Period {
    period_number: number;
    objectives: string[];
    materials: {
        teacher: string;
        student: string;
    };
    activities: Activity[];
}

export interface LessonPlanResponse {
    lesson_full_title: string;
    week: string;
    grade_class: string;
    date_range: string;
    periods: Period[];
}

export interface InputState {
    week: string;
    subject: string;
    grade: string;
    periods: string;
    duration: string;
    lessonName: string;
    context: string;
    integrateDigitalSkills: boolean;
    integrateAI: boolean;
    integrationNotes: string;
}

export interface ImageFile {
    file: File;
    previewUrl: string;
}

export type SourceType = 'image' | 'pdf';