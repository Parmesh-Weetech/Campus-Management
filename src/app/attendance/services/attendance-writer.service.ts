import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "./entities/attendance.entity";
import { Repository } from "typeorm";
import { CreateAttendanceReqDTO } from "../rest/dto/request/create-attendance-req.dto";
import { UpdateAttendanceReqDTO } from "../rest/dto/request/update-attendance-req.dto";

@Injectable()
export class AttendanceWriterService {
    constructor(
        @InjectRepository(Attendance)
        private readonly attendanceRepository: Repository<Attendance>
    ) { }

    async createAttendance(
        createAttendanceReqDTO: CreateAttendanceReqDTO,
        studentId: string,
        currentUserId: string
    ): Promise<Attendance> {
        return await this.attendanceRepository.save({
            date: createAttendanceReqDTO.date,
            status: createAttendanceReqDTO.status,
            className: createAttendanceReqDTO.className,
            student: { id: studentId },
            recordedBy: { id: currentUserId }
        });
    }

    async updateAttendance(
        attendance: Attendance,
        updateAttendanceReqDTO: UpdateAttendanceReqDTO,
        currentUserId: string
    ): Promise<Attendance> {
        return await this.attendanceRepository.save({
            ...attendance,
            ...updateAttendanceReqDTO,
            recordedBy: { id: currentUserId }
        });
    }

    async deleteAttendance(attendanceId: string): Promise<void> {
        await this.attendanceRepository.softDelete(attendanceId);
    }
}
