export type AttendanceSummaryQuery = {
    page: number;
    size: number;
    studentId?: string;
    className?: string;
    monthStart?: string;
    monthEnd?: string;
};

export type AttendanceSummaryRow = {
    studentId: string;
    className: string;
    month: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    totalCount: number;
};
