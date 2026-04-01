import { Attendance } from "../../attendance/entities/attendance.entity";

export type AttendanceCacheRecord = Attendance;

export interface AttendanceListOptions {
    page?: number;
    pageSize?: number;
    order?: 'asc' | 'desc';
}

export interface AttendanceListCacheParams {
    studentId: string;
    className?: string;
    monthStart: string;
    monthEnd: string;
    page: number;
    size: number;
}