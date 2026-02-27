import { Body, Controller, Get, Query } from "@nestjs/common";
import { AttendanceService } from "src/app/attendance/attendance.service";
import { GetCurrentUser } from "src/app/auth/decorators/currentUser.decorator";
import { Role } from "src/app/auth/decorators/role.decorator";
import { User } from "src/app/user/entities/user.entity";
import { UserRole } from "src/app/user/types/user-role";
import { AttendanceListResDTO } from "../dto/response/attendance-list-res.dto";
import { ListStudentAttendanceReqDTO } from "../dto/request/list-student-attendance-req.dto";
import { AttendanceResDTO } from "../dto/response/attendance-res.dto";
import { GetAttendanceByDateClassReqDTO } from "../dto/request/get-attendance-by-date-class-req.dto";

@Controller('student')
export class StudentController {
    constructor(
        private readonly attendanceService: AttendanceService
    ) { }

    @Get('attendance/list')
    @Role(UserRole.STUDENT)
    async listAttendance(
        @Body() listStudentAttendanceReqDTO: ListStudentAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceListResDTO> {
        return await this.attendanceService.listAttendance(listStudentAttendanceReqDTO, user);
    }

    @Get('attendance')
    @Role(UserRole.STUDENT)
    async getAttendanceByDateAndClass(
        @Query() query: GetAttendanceByDateClassReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.getAttendanceByStudentDateClass(
            user.id,
            query.date,
            query.className
        );
    }
}
