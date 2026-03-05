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
import { UserService } from '../user/user.service';
import { CustomExceptionFactory } from '../common/exception/custom-exception.factory';
import { ErrorCode } from '../common/exception/error-code';

@Injectable()
export class AttendanceService {
    constructor(
        private readonly attendanceWriterService: AttendanceWriterService,
        private readonly attendanceReaderService: AttendanceReaderService,
        private readonly userService: UserService
    ) { }

    async createAttendance(
        createAttendanceReqDTO: CreateAttendanceReqDTO,
        studentId: string,
        currentUserId: string
    ): Promise<AttendanceResDTO> {
        if (!studentId) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, "Invalid studentId");

        if (!currentUserId) {
            throw CustomExceptionFactory.create(ErrorCode.USER_NOT_IN_REQUEST, "Current user not found in request");
        }

        const [student, recordedBy] = await Promise.all([
            this.userService.findByIdOrThrow(studentId),
            this.userService.findByIdOrThrow(currentUserId)
        ]);

        if (!student) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_FOUND, "Student not found");

        if (student.data.userRole !== UserRole.STUDENT) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, "Attendance can only be recorded for students");

        if (!recordedBy) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_FOUND)

        const existingAttendance = await this.attendanceReaderService.findByStudentDateClass(
            studentId,
            createAttendanceReqDTO.date,
            createAttendanceReqDTO.className
        );

        if (existingAttendance) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_ALREADY_EXISTS, "Attendance already exists for this student, class, and date");

        const attendance = await this.attendanceWriterService.createAttendance(
            createAttendanceReqDTO,
            studentId,
            currentUserId
        );

        if (!attendance) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_CREATE_FAILED);

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
        if (!attendanceId) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, "attendanceId is required");

        if (!currentUserId) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_IN_REQUEST);

        if (
            updateAttendanceReqDTO.date === undefined &&
            updateAttendanceReqDTO.status === undefined &&
            updateAttendanceReqDTO.className === undefined
        ) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_EMPTY_UPDATE_PAYLOAD);

        const existingAttendance = await this.attendanceReaderService.findByIdWithRelations(attendanceId);

        if (!existingAttendance) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_NOT_FOUND);

        const nextDate = updateAttendanceReqDTO.date ?? existingAttendance.date;
        const nextClassName = updateAttendanceReqDTO.className ?? existingAttendance.className;

        const duplicateAttendance = await this.attendanceReaderService.findDuplicateForUpdate(
            attendanceId,
            existingAttendance.student.id,
            nextDate,
            nextClassName
        );

        if (duplicateAttendance) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_ALREADY_EXISTS);

        const updatedAttendance = await this.attendanceWriterService.updateAttendance(
            existingAttendance,
            updateAttendanceReqDTO,
            currentUserId
        );

        if (!updatedAttendance) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_UPDATE_FAILED);

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

        if (!studentId) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, 'StudentId is required!');

        if (
            currentUser.userRole === UserRole.STUDENT &&
            listAttendanceReqDTO.studentId &&
            listAttendanceReqDTO.studentId !== currentUser.id
        ) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_STUDENT_SCOPE_VIOLATION);


        let monthStart: string;
        let monthEnd: string;

        const today = new Date();

        let year = today.getUTCFullYear();
        let month = today.getUTCMonth() + 1;

        if (listAttendanceReqDTO.month) {
            const parts = listAttendanceReqDTO.month.split('-');
            year = Number(parts[0]);
            month = Number(parts[1]);
        }

        monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
        monthEnd = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
        
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

    async getAttendanceByStudentDateClass(studentId: string, date: string | undefined, className: string): Promise<AttendanceResDTO> {
        if (!date) {
            const newDate = new Date();
            const year = newDate.getFullYear();
            const month = String(newDate.getMonth() + 1).padStart(2, '0');
            const day = String(newDate.getDate()).padStart(2, '0');

            date = `${year}-${month}-${day}`;
        }

        if (!className) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, "ClassName is required");

        const attendance = await this.attendanceReaderService.findByStudentDateClass(studentId, date, className);

        if (!attendance) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_NOT_FOUND);

        return {
            success: true,
            expired: false,
            data: attendance,
            message: "Attendance Found.",
            statusCode: 200
        };
    }

    async deleteAttendance(attendanceId: string, currentUserId: string): Promise<AttendanceResDTO> {
        if (!attendanceId) throw CustomExceptionFactory.create(ErrorCode.BAD_REQUEST, "attendanceId is required");

        if (!currentUserId) throw CustomExceptionFactory.create(ErrorCode.USER_NOT_IN_REQUEST);

        const existingAttendance = await this.attendanceReaderService.findByIdWithRelations(attendanceId);

        if (!existingAttendance) throw CustomExceptionFactory.create(ErrorCode.ATTENDANCE_NOT_FOUND);

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
