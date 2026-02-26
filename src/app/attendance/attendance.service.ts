import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AttendanceWriterService } from './attendance-writer.service';
import { CreateAttendanceReqDTO } from '../rest/dto/request/create-attendance-req.dto';
import { AttendanceResDTO } from '../rest/dto/response/attendance-res.dto';
import { UpdateAttendanceReqDTO } from '../rest/dto/request/update-attendance-req.dto';
import { ListAttendanceReqDTO } from '../rest/dto/request/list-attendance-req.dto';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/types/user-role';
import { AttendanceListResDTO } from '../rest/dto/response/attendance-list-res.dto';
import { AttendanceReaderService } from './attendance-reader.service';

@Injectable()
export class AttendanceService {
    constructor(
        private readonly attendanceWriterService: AttendanceWriterService,
        private readonly attendanceReaderService: AttendanceReaderService
    ) { }

    async createAttendance(
        createAttendanceReqDTO: CreateAttendanceReqDTO,
        studentId: string,
        currentUserId: string
    ): Promise<AttendanceResDTO> {
        if (!studentId) {
            throw new BadRequestException({ message: "studentId is required" });
        }

        if (!currentUserId) {
            throw new BadRequestException({ message: "Current user not found in request" });
        }

        // const [student, recordedBy] = await Promise.all([
        //     this.userRepository.findOne({ where: { id: studentId } }),
        //     this.userRepository.findOne({ where: { id: currentUserId } })
        // ]);

        // if (!student) {
        //     throw new NotFoundException({ message: "Student not found" });
        // }

        // if (student.userRole !== UserRole.STUDENT) {
        //     throw new BadRequestException({ message: "Attendance can only be recorded for students" });
        // }

        // if (!recordedBy) {
        //     throw new NotFoundException({ message: "Recorder user not found" });
        // }

        const existingAttendance = await this.attendanceReaderService.findByStudentDateClass(
            studentId,
            createAttendanceReqDTO.date,
            createAttendanceReqDTO.className
        );

        if (existingAttendance) {
            throw new BadRequestException({ message: "Attendance already exists for this student, class, and date" });
        }

        const attendance = await this.attendanceWriterService.createAttendance(
            createAttendanceReqDTO,
            studentId,
            currentUserId
        );

        if (!attendance) throw new InternalServerErrorException({ message: "Internal Server Error while creating attendance" });

        return {
            success: true,
            expired: false,
            message: 'Attendance recorded successfully.',
            statusCode: 201,
            data: attendance
        };
    }

    async updateAttendance(
        updateAttendanceReqDTO: UpdateAttendanceReqDTO,
        attendanceId: string,
        currentUserId: string
    ): Promise<AttendanceResDTO> {
        if (!attendanceId) {
            throw new BadRequestException({ message: "attendanceId is required" });
        }

        if (!currentUserId) {
            throw new BadRequestException({ message: "Current user not found in request" });
        }

        if (
            updateAttendanceReqDTO.date === undefined &&
            updateAttendanceReqDTO.status === undefined &&
            updateAttendanceReqDTO.className === undefined
        ) {
            throw new BadRequestException({ message: "At least one field is required to update attendance" });
        }

        const existingAttendance = await this.attendanceReaderService.findByIdWithRelations(attendanceId);

        if (!existingAttendance) {
            throw new NotFoundException({ message: "Attendance not found" });
        }

        const nextDate = updateAttendanceReqDTO.date ?? existingAttendance.date;
        const nextClassName = updateAttendanceReqDTO.className ?? existingAttendance.className;

        const duplicateAttendance = await this.attendanceReaderService.findDuplicateForUpdate(
            attendanceId,
            existingAttendance.student.id,
            nextDate,
            nextClassName
        );

        if (duplicateAttendance) {
            throw new BadRequestException({ message: "Attendance already exists for this student, class, and date" });
        }

        const updatedAttendance = await this.attendanceWriterService.updateAttendance(
            existingAttendance,
            updateAttendanceReqDTO,
            currentUserId
        );

        if (!updatedAttendance) throw new InternalServerErrorException({ message: "Internal Server Error while updating record" });

        return {
            success: true,
            expired: false,
            message: 'Attendance updated successfully.',
            statusCode: 200,
            data: updatedAttendance
        };
    }

    async listAttendance(
        listAttendanceReqDTO: ListAttendanceReqDTO,
        currentUser: User
    ): Promise<AttendanceListResDTO> {
        const page = listAttendanceReqDTO.page ?? 1;
        const size = listAttendanceReqDTO.size ?? 10;

        const studentId =
            currentUser.userRole === UserRole.STUDENT
                ? currentUser.id
                : listAttendanceReqDTO.studentId;

        if (currentUser.userRole === UserRole.STUDENT && listAttendanceReqDTO.studentId && listAttendanceReqDTO.studentId !== currentUser.id) {
            throw new BadRequestException({ message: "Students can only view your own attendance" });
        }

        let monthStart: string | undefined;
        let monthEnd: string | undefined;
        if (listAttendanceReqDTO.month) {
            const [year, month] = listAttendanceReqDTO.month.split('-').map((val) => Number(val));
            monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
            monthEnd = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
        }

        const [items, total] = await this.attendanceReaderService.listAttendance({
            page,
            size,
            studentId,
            className: listAttendanceReqDTO.className,
            monthStart,
            monthEnd
        });
        const totalPages = Math.max(1, Math.ceil(total / size));

        return {
            success: true,
            expired: false,
            message: 'Attendance list fetched successfully.',
            statusCode: 200,
            data: {
                items,
                total,
                page,
                size,
                totalPages
            }
        };
    }

    async deleteAttendance(attendanceId: string, currentUserId: string): Promise<AttendanceResDTO> {
        if (!attendanceId) {
            throw new BadRequestException({ message: "attendanceId is required" });
        }

        if (!currentUserId) {
            throw new BadRequestException({ message: "Current user not found in request" });
        }

        const existingAttendance = await this.attendanceWriterService.findByIdWithRelations(attendanceId);

        if (!existingAttendance) {
            throw new NotFoundException({ message: "Attendance not found" });
        }

        await this.attendanceWriterService.deleteAttendance(attendanceId);

        return {
            success: true,
            expired: false,
            message: 'Attendance deleted successfully.',
            statusCode: 200,
            data: existingAttendance
        };
    }
}
