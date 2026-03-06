import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { Not, Repository } from "typeorm";

type ListAttendanceQuery = {
    page: number;
    size: number;
    studentId?: string;
    className?: string;
    monthStart?: string;
    monthEnd?: string;
};

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
                date,
                className
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
            .orderBy('attendance.date', 'DESC')
            .addOrderBy('attendance.createdAt', 'DESC')
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

        return await queryBuilder.getManyAndCount();
    }

}
