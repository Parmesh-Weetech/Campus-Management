import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { Not, Repository } from "typeorm";
import { ListAttendanceQuery } from "./types/listAttendanceQuery.types";

@Injectable()
export class AttendanceReaderService {
    constructor(
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>
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

}
