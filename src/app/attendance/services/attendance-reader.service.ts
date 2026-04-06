import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "../entities/attendance.entity";
import { DataSource, Not, ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { ListAttendanceQuery } from "../types/listAttendanceQuery.types";
import { AttendanceSummaryQuery, AttendanceSummaryRow } from "../types/attendanceSummaryQuery.types";

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
        const offset = (query.page - 1) * query.size;
        const limit = query.size;
        const result = await this.dataSource.query(
            'SELECT * FROM get_attendance_summary($1, $2, $3, $4, $5, $6)',
            [
                query.studentId,
                query.className ?? null,
                query.monthStart,
                query.monthEnd,
                offset,
                limit
            ]
        );

        const items = result.map((item: any) => ({
            studentId: item.studentid,
            className: item.classname,
            month: item.month,
            presentCount: Number(item.presentcount),
            absentCount: Number(item.absentcount),
            lateCount: Number(item.latecount),
            totalCount: Number(item.totalcount)
        }));

        const total = items.length;
        return [items, total];
    }

}
