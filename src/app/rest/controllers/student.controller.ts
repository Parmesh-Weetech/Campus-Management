import { Controller, Get, Query } from "@nestjs/common";
import { AttendanceService } from "../../attendance/attendance.service";
import { GetCurrentUser } from "../../auth/decorators/currentUser.decorator";
import { Role } from "../../auth/decorators/role.decorator";
import { User } from "../../user/entities/user.entity";
import { UserRole } from "../../user/types/user-role";
import { AttendanceListResDTO } from "../dto/response/attendance-list-res.dto";
import { ListStudentAttendanceReqDTO } from "../dto/request/list-student-attendance-req.dto";
import { AttendanceResDTO } from "../dto/response/attendance-res.dto";
import { AttendanceByDateClassReqDTO } from "../dto/request/get-attendance-by-date-class-req.dto";
import { ApiBearerAuth, ApiResponse, ApiTags } from "@nestjs/swagger";

@Controller({ path: 'student' })
@ApiTags('student')
@ApiBearerAuth()
export class StudentController {
    constructor(
        private readonly attendanceService: AttendanceService
    ) { }

    @Get('attendance/list')
    @Role(UserRole.STUDENT)
    @ApiResponse({ status: 200, type: AttendanceListResDTO })
    async listAttendance(
        @Query() listStudentAttendanceReqDTO: ListStudentAttendanceReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceListResDTO> {
        return await this.attendanceService.listAttendance(listStudentAttendanceReqDTO, user);
    }

    @Get('attendance')
    @Role(UserRole.STUDENT)
    @ApiResponse({ status: 200, type: AttendanceResDTO })
    async getAttendanceByDateAndClass(
        @Query() query: AttendanceByDateClassReqDTO,
        @GetCurrentUser() user: User
    ): Promise<AttendanceResDTO> {
        return await this.attendanceService.getAttendanceByStudentDateClass(
            user.id,
            query.date,
            query.className
        );
    }
}
