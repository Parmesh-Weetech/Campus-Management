export type ListAttendanceQuery = {
    page: number;
    size: number;
    studentId?: string;
    className?: string;
    monthStart?: string;
    monthEnd?: string;
};