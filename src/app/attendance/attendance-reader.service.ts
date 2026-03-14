import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { DataSource, Not, ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { ListAttendanceQuery } from "./types/listAttendanceQuery.types";
import { AttendanceSummaryQuery, AttendanceSummaryRow } from "./types/attendanceSummaryQuery.types";

@Injectable()
export class AttendanceReaderService {
    constructor(
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>,
        private readonly dataSource: DataSource
    ) { }

    async findByStudentDateClass(studentId: string, date: string, className: string): Promise<Attendance | null> {
        return await this.attendanceRepository.findOne({
            where: {
                student: { id: studentId },
                date: date,
                className: className
            }
        });
    }

    async findByIdWithRelations(attendanceId: string): Promise<Attendance | null> {
        return await this.attendanceRepository.findOne({
            where: { id: attendanceId },
            relations: {
                student: true,
                recordedBy: true
            }
        });
    }

    async findDuplicateForUpdate(
        attendanceId: string,
        studentId: string,
        date: string,
        className: string
    ): Promise<Attendance | null> {
        return await this.attendanceRepository.findOne({
            where: {
                id: Not(attendanceId),
                student: { id: studentId },
                date,
                className
            }
        });
    }

    async listAttendance(query: ListAttendanceQuery): Promise<[Attendance[], number]> {
        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.student', 'student')
            .leftJoinAndSelect('attendance.recordedBy', 'recordedBy')
            .where('attendance.deletedAt IS NULL')
            .skip((query.page - 1) * query.size)
            .take(query.size);

        if (query.studentId) {
            queryBuilder.andWhere('student.id = :studentId', { studentId: query.studentId });
        }

        if (query.className) {
            queryBuilder.andWhere('LOWER(attendance.className) LIKE LOWER(:className)', {
                className: `%${query.className}%`
            });
        }

        if (query.monthStart && query.monthEnd) {
            queryBuilder.andWhere('attendance.date >= :monthStart AND attendance.date < :monthEnd', {
                monthStart: query.monthStart,
                monthEnd: query.monthEnd
            });
        }

        // Conditional ordering
        if (!query.className) {
            queryBuilder.orderBy('attendance.className', 'ASC');
        } else {
            queryBuilder
                .orderBy('attendance.date', 'DESC')
                .addOrderBy('attendance.createdAt', 'DESC');
        }

        return await queryBuilder.getManyAndCount();
    }

    private applySummaryFilters(
        queryBuilder: SelectQueryBuilder<ObjectLiteral>,
        query: AttendanceSummaryQuery
    ): SelectQueryBuilder<ObjectLiteral> {
        if (query.studentId) {
            queryBuilder.andWhere('summary."studentId" = :studentId', { studentId: query.studentId });
        }

        if (query.className) {
            queryBuilder.andWhere('LOWER(summary."className") LIKE LOWER(:className)', {
                className: `%${query.className}%`
            });
        }

        if (query.monthStart && query.monthEnd) {
            queryBuilder.andWhere('summary."month" >= :monthStart AND summary."month" < :monthEnd', {
                monthStart: query.monthStart,
                monthEnd: query.monthEnd
            });
        }

        return queryBuilder;
    }

    async listAttendanceSummary(
        query: AttendanceSummaryQuery
    ): Promise<[AttendanceSummaryRow[], number]> {
        const baseQuery = this.dataSource
            .createQueryBuilder()
            .select([
                'summary."studentId" AS "studentId"',
                'summary."className" AS "className"',
                'summary."month" AS "month"',
                'summary."presentCount" AS "presentCount"',
                'summary."absentCount" AS "absentCount"',
                'summary."lateCount" AS "lateCount"',
                'summary."totalCount" AS "totalCount"'
            ])
            .from('attendance_summary_view', 'summary');

        this.applySummaryFilters(baseQuery, query);

        baseQuery
            .orderBy('summary."month"', 'DESC')
            .addOrderBy('summary."className"', 'ASC')
            .skip((query.page - 1) * query.size)
            .take(query.size);

        const countQuery = this.dataSource
            .createQueryBuilder()
            .select('COUNT(*)', 'count')
            .from('attendance_summary_view', 'summary');

        this.applySummaryFilters(countQuery, query);

        const [rawItems, countResult] = await Promise.all([
            baseQuery.getRawMany<AttendanceSummaryRow>(),
            countQuery.getRawOne<{ count: string }>()
        ]);

        const items = rawItems.map((item) => ({
            ...item,
            presentCount: Number(item.presentCount),
            absentCount: Number(item.absentCount),
            lateCount: Number(item.lateCount),
            totalCount: Number(item.totalCount)
        }));

        const total = countResult ? Number(countResult.count) : 0;

        return [items, total];
    }

}
